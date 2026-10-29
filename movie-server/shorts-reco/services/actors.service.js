'use strict';

const config = require('../config');
const collections = require('../config/collections');
const { actorProfileKey } = require('../utils/keys');

const movieShortType = collections.existing.shortsVideos.type;

/**
 * Engagement stored for a movie is the sum of max(0, shortScore)
 * over that user's movieShorts only.
 * @param {string} shortType
 * @param {number} oldScore
 * @param {number} newScore
 * @param {number} [decayFactor]
 * @returns {number}
 */
const movieEngagementDelta = (shortType, oldScore, newScore, decayFactor = 1) => {
  if (shortType !== movieShortType) return 0;
  return Math.max(0, newScore) - Math.max(0, oldScore) * decayFactor;
};

/**
 * @param {number} raw
 * @returns {number}
 */
const cappedEngagement = (raw) =>
  Math.min(config.movieContributionCap, Math.max(0, raw || 0));

/**
 * @param {number} raw
 * @returns {boolean}
 */
const isQualifying = (raw) => cappedEngagement(raw) >= config.qualifyThreshold;

/**
 * @param {Record<string, number>} engagementByMovieId
 * @param {Record<string, Array<number|string>>} actorsByMovieId
 * @param {number} [limit]
 * @returns {object[]}
 */
const topQualifyingMovies = (engagementByMovieId, actorsByMovieId, limit) => {
  const cap = limit == null ? config.topQualifyingMoviesLimit : limit;
  const rows = [];
  const source = engagementByMovieId || {};
  const actors = actorsByMovieId || {};

  Object.keys(source).forEach((movieId) => {
    const raw = source[movieId];
    if (!isQualifying(raw)) return;
    rows.push({
      movieId,
      raw,
      capped: cappedEngagement(raw),
      actors: Array.isArray(actors[movieId]) ? actors[movieId] : [],
    });
  });

  rows.sort((left, right) => {
    if (right.capped !== left.capped) return right.capped - left.capped;
    return String(left.movieId).localeCompare(String(right.movieId));
  });
  return rows.slice(0, cap);
};

/**
 * An actor is confirmed only after `actorConfirmMinMovies` different qualifying movies.
 * One movie counts once even if the actor id is repeated.
 * @param {object[]} movies
 * @param {Record<string, number>} [penalties]
 * @returns {{ scores: Record<string, number>, ids: Set<string> }}
 */
const confirmedActors = (movies, penalties = {}) => {
  /** @type {Map<string, { count: number, sum: number }>} */
  const tally = new Map();

  for (let i = 0; i < movies.length; i += 1) {
    const seen = new Set();
    const list = movies[i].actors || [];
    for (let j = 0; j < list.length; j += 1) {
      const actorId = String(list[j]);
      if (!actorId || seen.has(actorId)) continue;
      seen.add(actorId);
      const current = tally.get(actorId) || { count: 0, sum: 0 };
      current.count += 1;
      current.sum += movies[i].capped;
      tally.set(actorId, current);
    }
  }

  /** @type {Record<string, number>} */
  const scores = {};
  const ids = new Set();
  tally.forEach((row, actorId) => {
    if (row.count < config.actorConfirmMinMovies) return;
    ids.add(actorId);
    const penalty = penalties[actorProfileKey(actorId)] || 0;
    scores[actorId] = Math.max(0, row.sum - penalty);
  });
  return { scores, ids };
};

/**
 * @param {number} score
 * @returns {number}
 */
const skipPenaltyAmount = (score) => {
  if (!(score < 0)) return 0;
  return config.actorSkipPenaltyFactor * Math.abs(score);
};

/**
 * Largest remainder. Slot count 0 yields an empty assignment.
 * @param {Record<string, number>} scores
 * @param {number} slotCount
 * @returns {Record<string, number>}
 */
const splitActorSlots = (scores, slotCount) => {
  const entries = Object.entries(scores || {}).filter(([, score]) => score > 0);
  if (!slotCount || slotCount <= 0 || entries.length === 0) return {};

  const total = entries.reduce((sum, [, score]) => sum + score, 0);
  if (total <= 0) return {};

  const rows = entries.map(([id, score]) => {
    const exact = (score / total) * slotCount;
    const base = Math.floor(exact);
    return { id, slots: base, remainder: exact - base };
  });
  let used = rows.reduce((sum, row) => sum + row.slots, 0);
  const ranked = [...rows].sort((left, right) => {
    if (right.remainder !== left.remainder) return right.remainder - left.remainder;
    return left.id < right.id ? -1 : 1;
  });

  let cursor = 0;
  while (used < slotCount && ranked.length > 0) {
    ranked[cursor % ranked.length].slots += 1;
    used += 1;
    cursor += 1;
    if (cursor > slotCount * ranked.length) break;
  }

  /** @type {Record<string, number>} */
  const assignment = {};
  for (let i = 0; i < rows.length; i += 1) {
    assignment[rows[i].id] = rows[i].slots;
  }
  return assignment;
};

module.exports = {
  movieEngagementDelta,
  cappedEngagement,
  isQualifying,
  topQualifyingMovies,
  confirmedActors,
  skipPenaltyAmount,
  splitActorSlots,
};
