/**
 * Precompute personalized Top-N per user × category and write cache.
 * Candidate pool is capped (candidatePoolSize) — never full-scans 20k+ blindly.
 *
 * @module recommendation/services/precompute.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { scoreMovies, hasPersonalizationSignal } = require('./scoring.service');
const { diversifyRecommendations } = require('./diversity.service');
const { toDecayedAffinityMap } = require('../utils/decay');
const { findMoviesByCategory } = require('../repositories/movieProjection.repository');
const { getAffinityMapWithMeta } = require('../repositories/userAffinity.repository');
const { listWatchedMovieIds } = require('../repositories/watchEvent.repository');
const {
  replaceUserCategoryRecommendations,
  listCachedRecommendations,
} = require('../repositories/userRecommendation.repository');

/**
 * Build diversified Top-N and persist to user_recommendations cache.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} category
 * @param {Object} [options]
 * @param {number} [options.topN]
 * @param {number} [options.candidatePoolSize]
 * @param {Date|number} [options.now]
 * @returns {Promise<{
 *   userId: *,
 *   category: string,
 *   written: number,
 *   source: 'personalized'|'cold_start',
 *   generatedAt: Date,
 *   items: import('../types/recommendation.types').ScoredMovie[],
 * }>}
 */
const precomputeUserCategoryRecommendations = async (userId, category, options = {}) => {
  const cat = String(category || '').trim();
  if (!userId || !cat) {
    const err = new Error('userId and category are required for precompute');
    err.status = 400;
    throw err;
  }

  const topN = options.topN ?? scoringWeights.topN;
  const poolSize = options.candidatePoolSize ?? scoringWeights.candidatePoolSize;
  const now = options.now ?? Date.now();
  const nowMs = now instanceof Date ? now.getTime() : now;
  const generatedAt = new Date(nowMs);

  const [movies, affinityMeta, watchedIds] = await Promise.all([
    findMoviesByCategory(cat, poolSize),
    getAffinityMapWithMeta(userId, cat),
    listWatchedMovieIds(userId, cat),
  ]);

  const affinityMap = toDecayedAffinityMap(affinityMeta, nowMs, scoringWeights.decay);
  const personalized = hasPersonalizationSignal(affinityMap);

  const scored = scoreMovies(movies, {
    affinityMap,
    watchedIds,
    now: nowMs,
  });

  const diversified = diversifyRecommendations(scored, { limit: topN });

  const cacheRows = diversified.map((item, index) => ({
    movieId: item.movie.id,
    score: item.score,
    rank: index + 1,
  }));

  const { written } = await replaceUserCategoryRecommendations(userId, cat, cacheRows);

  return {
    userId,
    category: cat,
    written,
    source: personalized ? 'personalized' : 'cold_start',
    generatedAt,
    items: diversified,
  };
};

/**
 * Read precomputed cache (serve path).
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} category
 * @param {number} [limit]
 */
const getCachedTopN = (userId, category, limit = scoringWeights.topN) =>
  listCachedRecommendations(userId, category, limit);

module.exports = {
  precomputeUserCategoryRecommendations,
  getCachedTopN,
};
