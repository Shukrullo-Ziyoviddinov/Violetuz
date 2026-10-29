'use strict';

const config = require('../config');
const collections = require('../config/collections');

const movieType = collections.existing.shortsVideos.type;
const musicType = collections.existing.musicShorts.type;

/**
 * @param {object[]} docs
 */
const byFreshness = (docs) => docs.slice().sort((left, right) => {
  const leftTime = left.catalogAddedAt ? new Date(left.catalogAddedAt).getTime() : 0;
  const rightTime = right.catalogAddedAt ? new Date(right.catalogAddedAt).getTime() : 0;
  return rightTime - leftTime;
});

/**
 * @param {object[]} docs
 * @param {string[]} popularIds
 */
const byPopular = (docs, popularIds) => {
  const rank = new Map((popularIds || []).map((id, index) => [id, index]));
  return docs
    .filter((doc) => rank.has(doc.shortId))
    .sort((left, right) => rank.get(left.shortId) - rank.get(right.shortId));
};

/**
 * @param {object[]} fresh
 * @param {object[]} popular
 */
const interleaveSources = (fresh, popular) => {
  const out = [];
  const seen = new Set();
  const push = (doc) => {
    if (!doc || seen.has(doc.shortId)) return;
    seen.add(doc.shortId);
    out.push(doc);
  };
  const max = Math.max(fresh.length, popular.length);
  for (let i = 0; i < max; i += 1) {
    push(fresh[i]);
    push(popular[i]);
    if (fresh.length) push(fresh[(i * 2 + 1) % fresh.length]);
  }
  fresh.forEach(push);
  return out;
};

/**
 * @param {object[]} docs
 */
const alternateTypes = (docs) => {
  const movies = docs.filter((doc) => doc.type === movieType);
  const music = docs.filter((doc) => doc.type === musicType);
  const out = [];
  let movieTurn = true;
  while (movies.length || music.length) {
    const primary = movieTurn ? movies : music;
    const other = movieTurn ? music : movies;
    const next = primary.shift() || other.shift();
    if (!next) break;
    out.push(next);
    movieTurn = !movieTurn;
  }
  return out;
};

/**
 * No profile, or fewer than coldStartMinViews. One or two views blend a profile pick.
 * @param {{
 *   docs: object[],
 *   popularIds?: string[],
 *   limit?: number,
 *   profileDocs?: object[],
 *   viewCount?: number,
 * }} input
 */
const mixColdStart = (input) => {
  const source = input || {};
  const pool = interleaveSources(byFreshness(source.docs || []), byPopular(source.docs || [], source.popularIds));
  const mixed = alternateTypes(pool);
  const size = source.limit || config.feedBatchSize;
  const views = source.viewCount || 0;
  const profileDocs = source.profileDocs || [];
  if (!views || views >= config.coldStartMinViews || profileDocs.length === 0) {
    return mixed.slice(0, size);
  }

  const out = [];
  let profileIndex = 0;
  for (let i = 0; i < mixed.length && out.length < size; i += 1) {
    const useProfile = (out.length + 1) % config.coldStartProfileEvery === 0 && profileDocs[profileIndex];
    if (useProfile) {
      out.push(profileDocs[profileIndex]);
      profileIndex += 1;
    } else {
      out.push(mixed[i]);
    }
  }
  return out;
};

module.exports = {
  mixColdStart,
  alternateTypes,
};
