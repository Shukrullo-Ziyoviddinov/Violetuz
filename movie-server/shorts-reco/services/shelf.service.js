'use strict';

const config = require('../config');
const { parseShortCatalogId } = require('../utils/keys');
const { createCatalogRepo } = require('../repositories/catalog.repo');
const { createWatchStateRepo } = require('../repositories/watchState.repo');
const { createProfileRepo } = require('../repositories/profile.repo');
const { createStatsRepo } = require('../repositories/stats.repo');
const { emptyProfile, hydrateProfile } = require('./profile.service');
const { feedScoreOf } = require('./affinity.service');
const { seenStatus } = require('./eligibility.service');

/**
 * Highest interest first. Equal scores stay in shortId order.
 * @param {{ doc: object, score: number }} left
 * @param {{ doc: object, score: number }} right
 */
const byInterest = (left, right) => {
  if (right.score !== left.score) return right.score - left.score;
  return String(left.doc.shortId).localeCompare(String(right.doc.shortId));
};

/**
 * @param {object|undefined} prev
 * @param {object} doc
 */
const sameNeighbor = (prev, doc) => {
  if (!prev || !doc) return false;
  if (doc.artistId && prev.artistId === doc.artistId) return true;
  if (doc.musicKey && prev.musicKey === doc.musicKey) return true;
  return doc.movieId != null && prev.movieId != null && String(doc.movieId) === String(prev.movieId);
};

/**
 * One ranked list for every row of this type. Neighbors change when another
 * short is still waiting. Each block takes the next slice of that list.
 * @param {object[]} ranked
 * @param {number} block
 * @param {number} limit
 */
const sliceBlock = (ranked, block, limit) => {
  const pending = (ranked || []).slice();
  const picked = [];
  while (pending.length) {
    const prev = picked[picked.length - 1];
    let index = pending.findIndex((doc) => !sameNeighbor(prev, doc));
    if (index < 0) index = 0;
    picked.push(pending.splice(index, 1)[0]);
  }
  return picked.slice(block * limit, (block + 1) * limit);
};

/**
 * @param {object} doc
 */
const cardOf = (doc) => {
  const parsed = parseShortCatalogId(doc.shortId);
  return {
    shortId: doc.shortId,
    id: parsed ? parsed.numericId : null,
    type: doc.type,
  };
};

/**
 * Same profile and score as the shorts feed. Cards keep one type and skip
 * the feed slot order, so a row is the strongest matches, not the next swipe.
 * @param {object} [options]
 */
const createShelfService = (options = {}) => {
  const catalog = options.catalogRepo || createCatalogRepo(options.connection);
  const watchesRepo = options.watchRepo || createWatchStateRepo(options.connection);
  const profiles = options.profileRepo || createProfileRepo(options.connection);
  const stats = options.statsRepo || createStatsRepo(options.connection);

  return {
    /**
     * @param {{ userId?: string|null, type: string, block?: number, limit?: number, now?: Date }} input
     */
    async serveShelf(input) {
      const request = input || {};
      const clock = request.now || new Date();
      const userId = request.userId ? String(request.userId) : null;
      const block = request.block || 0;
      const limit = request.limit || config.shelfBlockSize;
      const watchList = userId
        ? await watchesRepo.listByUser(userId, config.watchStateReadLimit)
        : [];
      const warm = Boolean(userId) && watchList.length >= config.coldStartMinViews;
      const stored = warm ? await profiles.findByUserId(userId) : null;
      const profile = warm
        ? hydrateProfile(stored, userId, clock)
        : emptyProfile(userId || 'guest', clock);
      const watchMap = new Map(watchList.map((row) => [row.shortId, row]));
      const docs = await catalog.findMatching(
        { type: request.type },
        config.shelfReadLimit,
        { catalogAddedAt: -1, shortId: 1 }
      );
      const statRows = await stats.listTop(config.shelfReadLimit);
      const statsByShortId = new Map(statRows.map((row) => [row.shortId, row]));
      const ranked = (docs || [])
        .filter((doc) => doc && doc.shortId && seenStatus(watchMap.get(doc.shortId), clock) !== 'blocked')
        .map((doc) => ({
          doc,
          score: feedScoreOf(doc, profile, statsByShortId.get(doc.shortId) || null, clock),
        }))
        .sort(byInterest)
        .map((row) => row.doc);

      return {
        type: request.type,
        block,
        items: sliceBlock(ranked, block, limit).map(cardOf),
      };
    },
  };
};

module.exports = {
  createShelfService,
  sliceBlock,
};
