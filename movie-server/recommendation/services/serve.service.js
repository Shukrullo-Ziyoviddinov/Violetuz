/**
 * Serve recommendations from precomputed cache (realtime fallback if empty/stale).
 *
 * Stale qoida (trending → user cache):
 *   - trending.updatedAt > cache.generatedAt → qayta precompute (lazy)
 *   - yoki cache yoshi > userCacheMaxAgeMs (absolute TTL)
 * Noto‘g‘ri: soatlik trendingdan keyin barcha user cache’ni deleteMany
 *   → thundering herd + bo‘sh oyna.
 *
 * @module recommendation/services/serve.service
 */

'use strict';

const mongoose = require('mongoose');
const { scoringWeights } = require('../config/scoringWeights');
const { getCachedTopN, precomputeUserCategoryRecommendations } = require('./precompute.service');
const { findMoviesByIdsPreserveOrder } = require('../repositories/movieProjection.repository');
const { getCategoryTrendingUpdatedAt } = require('../repositories/trending.repository');
const { enqueuePrecomputeRecommendations } = require('../jobs/precomputeRecommendations.job');
const { badRequest } = require('../../utils/errors');

/**
 * @param {unknown} value
 * @returns {import('mongoose').Types.ObjectId|null}
 */
const parseUserId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  const str = String(value).trim();
  if (!mongoose.Types.ObjectId.isValid(str)) return null;
  return new mongoose.Types.ObjectId(str);
};

/**
 * @param {Date|string|number|null|undefined} value
 * @returns {number|null} epoch ms
 */
const toEpochMs = (value) => {
  if (value == null || value === '') return null;
  const t = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
};

/**
 * Pure cache freshness rules (no DB) — used by isUserRecommendationCacheStale.
 *
 * @param {Object} params
 * @param {Date|string|number|null|undefined} params.cacheGeneratedAt
 * @param {Date|string|number|null|undefined} [params.trendingUpdatedAt]
 * @param {Date|number} [params.now]
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [params.weights]
 * @returns {{ stale: boolean, reason: string|null }}
 */
const evaluateUserCacheStale = ({
  cacheGeneratedAt,
  trendingUpdatedAt = null,
  now = Date.now(),
  weights = scoringWeights,
} = {}) => {
  const cacheMs = toEpochMs(cacheGeneratedAt);
  if (cacheMs == null) {
    return { stale: true, reason: 'missing_generated_at' };
  }

  const trendingCfg = weights.trending || {};
  const nowMs = now instanceof Date ? now.getTime() : now;

  const maxAgeMs =
    typeof trendingCfg.userCacheMaxAgeMs === 'number' && trendingCfg.userCacheMaxAgeMs > 0
      ? trendingCfg.userCacheMaxAgeMs
      : Math.max(60_000, (trendingCfg.precomputeIntervalMs || 3_600_000) * 2);

  if (nowMs - cacheMs > maxAgeMs) {
    return { stale: true, reason: 'max_age' };
  }

  if (trendingCfg.invalidateUserCacheWhenNewer === false) {
    return { stale: false, reason: null };
  }

  const trendingMs = toEpochMs(trendingUpdatedAt);
  if (trendingMs != null && trendingMs > cacheMs) {
    return { stale: true, reason: 'trending_newer' };
  }

  return { stale: false, reason: null };
};

/**
 * User recommendation cache eskirganmi?
 *
 * @param {string} category
 * @param {Date|string|null} cacheGeneratedAt
 * @param {Date|number} [now]
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [weights]
 * @returns {Promise<{ stale: boolean, reason: string|null }>}
 */
const isUserRecommendationCacheStale = async (
  category,
  cacheGeneratedAt,
  now = Date.now(),
  weights = scoringWeights
) => {
  let trendingUpdatedAt = null;
  if (weights.trending?.invalidateUserCacheWhenNewer !== false) {
    trendingUpdatedAt = await getCategoryTrendingUpdatedAt(category);
  }
  return evaluateUserCacheStale({
    cacheGeneratedAt,
    trendingUpdatedAt,
    now,
    weights,
  });
};

/**
 * GET recommendations for a category.
 *
 * @param {Object} params
 * @param {string|import('mongoose').Types.ObjectId} params.userId — must be auth user
 * @param {string} params.category — movie.categoryName
 * @param {number} [params.limit]
 * @param {boolean} [params.hydrate=true] — attach full movie documents
 * @param {boolean} [params.lazy=false] — Home: sync precompute o‘rniga queue + stale-while-revalidate
 * @returns {Promise<import('../types/recommendation.types').RecommendationResult & { movies?: Object[] }>}
 */
const getRecommendationsByCategory = async (params) => {
  const userId = parseUserId(params.userId);
  const category = String(params.category || '').trim();
  const limit = Math.max(1, Math.min(Number(params.limit) || scoringWeights.topN, scoringWeights.topN));
  const hydrate = params.hydrate !== false;
  const lazy = params.lazy === true || params.lazy === 'true' || params.lazy === '1';

  if (!userId) {
    throw badRequest('userId majburiy (auth)');
  }
  if (!category) {
    throw badRequest('category majburiy');
  }

  let source = 'cache';
  let generatedAt = null;
  let rows = await getCachedTopN(userId, category, limit);
  let queuedRefresh = false;

  if (rows.length) {
    generatedAt = rows[0]?.generatedAt || null;
    const freshness = await isUserRecommendationCacheStale(category, generatedAt);
    if (freshness.stale) {
      if (lazy) {
        // Stale-while-revalidate: eski ro‘yxatni qaytar, fonada yangila
        enqueuePrecomputeRecommendations({ userId, category });
        queuedRefresh = true;
        source = 'cache_stale';
      } else {
        rows = [];
        generatedAt = null;
        source = 'realtime';
      }
    }
  }

  if (!rows.length) {
    if (lazy) {
      // Cold Home: sync hisoblamasdan queue — FE katalog ko‘rsatadi
      enqueuePrecomputeRecommendations({ userId, category });
      source = 'pending';
      generatedAt = null;
      rows = [];
      queuedRefresh = true;
    } else {
      const computed = await precomputeUserCategoryRecommendations(userId, category, {
        topN: scoringWeights.topN,
      });
      source =
        computed.source === 'blended_cold_start' || computed.source === 'cold_start'
          ? 'cold_start'
          : 'realtime';
      generatedAt = computed.generatedAt;
      rows = computed.items.slice(0, limit).map((item, index) => ({
        movieId: String(item.movie.id),
        score: item.score,
        rank: index + 1,
        generatedAt,
      }));
    }
  }

  const items = rows.map((row) => ({
    movieId: row.movieId,
    score: row.score,
    rank: row.rank,
  }));

  /** @type {Object} */
  const result = {
    userId: String(userId),
    category,
    source,
    generatedAt,
    queuedRefresh,
    items,
  };

  if (hydrate && items.length) {
    const movies = await findMoviesByIdsPreserveOrder(items.map((i) => i.movieId));
    const scoreById = new Map(items.map((i) => [String(i.movieId), i]));
    result.movies = movies.map((movie) => ({
      ...movie,
      recommendationScore: scoreById.get(String(movie.id))?.score ?? null,
      recommendationRank: scoreById.get(String(movie.id))?.rank ?? null,
    }));
  } else {
    result.movies = [];
  }

  return result;
};

module.exports = {
  parseUserId,
  evaluateUserCacheStale,
  isUserRecommendationCacheStale,
  getRecommendationsByCategory,
};
