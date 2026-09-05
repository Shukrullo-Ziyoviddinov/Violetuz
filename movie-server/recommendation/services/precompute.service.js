/**
 * Precompute blended Top-N per user × category and write cache.
 * Candidate pool is capped (candidatePoolSize) — never full-scans 20k+ blindly.
 *
 * Scoring: blending.service (personalized + trending via alpha).
 * Diversity + cache write unchanged.
 *
 * @module recommendation/services/precompute.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { hasPersonalizationSignal } = require('./scoring.service');
const { scoreMoviesBlended } = require('./blending.service');
const { diversifyRecommendations } = require('./diversity.service');
const { toDecayedAffinityMap } = require('../utils/decay');
const { buildCategoryCandidatePool } = require('../repositories/movieProjection.repository');
const { getAffinityMapWithMeta } = require('../repositories/userAffinity.repository');
const { listWatchedMovieIds } = require('../repositories/userMovieProgress.repository');
const {
  replaceUserCategoryRecommendations,
  listCachedRecommendations,
} = require('../repositories/userRecommendation.repository');

/**
 * Build diversified Top-N and persist to user_recommendations cache.
 *
 * Candidate pool: popular slice + affinity niche expand (not popularity-only 400).
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} category
 * @param {Object} [options]
 * @param {number} [options.topN]
 * @param {number} [options.candidatePoolSize] — legacy alias → popularLimit
 * @param {Date|number} [options.now]
 */
const precomputeUserCategoryRecommendations = async (userId, category, options = {}) => {
  const cat = String(category || '').trim();
  if (!userId || !cat) {
    const err = new Error('userId and category are required for precompute');
    err.status = 400;
    throw err;
  }

  const topN = options.topN ?? scoringWeights.topN;
  const popularLimit =
    options.candidatePoolPopular ??
    options.candidatePoolSize ??
    scoringWeights.candidatePoolPopular ??
    300;
  const affinityLimit =
    options.candidatePoolAffinity ?? scoringWeights.candidatePoolAffinity ?? 150;
  const now = options.now ?? Date.now();
  const nowMs = now instanceof Date ? now.getTime() : now;
  const generatedAt = new Date(nowMs);

  const [affinityMeta, watchedIds] = await Promise.all([
    getAffinityMapWithMeta(userId, cat),
    listWatchedMovieIds(userId, cat),
  ]);

  const affinityMap = toDecayedAffinityMap(affinityMeta, nowMs, scoringWeights.decay);
  const personalized = hasPersonalizationSignal(affinityMap);

  const movies = await buildCategoryCandidatePool(cat, {
    affinityMap: personalized ? affinityMap : null,
    popularLimit,
    affinityLimit: personalized ? affinityLimit : 0,
    seedGenres: scoringWeights.affinitySeedGenres,
    seedCountries: scoringWeights.affinitySeedCountries,
    seedActors: scoringWeights.affinitySeedActors,
  });

  const scored = await scoreMoviesBlended(movies, {
    userId,
    category: cat,
    scoreOptions: {
      affinityMap,
      watchedIds,
      now: nowMs,
    },
  });

  const diversified = diversifyRecommendations(scored, { limit: topN });

  const cacheRows = diversified.map((item, index) => ({
    movieId: item.movie.id,
    score: item.score,
    rank: index + 1,
  }));

  const { written } = await replaceUserCategoryRecommendations(userId, cat, cacheRows);

  const alpha = diversified[0]?.alpha ?? scored[0]?.alpha ?? 0;
  const experienceCount =
    diversified[0]?.experienceCount ?? scored[0]?.experienceCount ?? 0;

  return {
    userId,
    category: cat,
    written,
    source: personalized ? 'blended' : 'blended_cold_start',
    alpha,
    experienceCount,
    poolSize: movies.length,
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
