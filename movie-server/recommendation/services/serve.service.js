/**
 * Serve recommendations from precomputed cache (realtime fallback if empty).
 *
 * @module recommendation/services/serve.service
 */

'use strict';

const mongoose = require('mongoose');
const { scoringWeights } = require('../config/scoringWeights');
const { getCachedTopN, precomputeUserCategoryRecommendations } = require('./precompute.service');
const { findMoviesByIdsPreserveOrder } = require('../repositories/movieProjection.repository');
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
 * GET recommendations for a category.
 *
 * @param {Object} params
 * @param {string|import('mongoose').Types.ObjectId} params.userId — must be auth user
 * @param {string} params.category — movie.categoryName
 * @param {number} [params.limit]
 * @param {boolean} [params.hydrate=true] — attach full movie documents
 * @returns {Promise<import('../types/recommendation.types').RecommendationResult & { movies?: Object[] }>}
 */
const getRecommendationsByCategory = async (params) => {
  const userId = parseUserId(params.userId);
  const category = String(params.category || '').trim();
  const limit = Math.max(1, Math.min(Number(params.limit) || scoringWeights.topN, scoringWeights.topN));
  const hydrate = params.hydrate !== false;

  if (!userId) {
    throw badRequest('userId majburiy (auth)');
  }
  if (!category) {
    throw badRequest('category majburiy');
  }

  let source = 'cache';
  let generatedAt = null;
  let rows = await getCachedTopN(userId, category, limit);

  if (!rows.length) {
    // Always persist full configured Top-N; response limit only slices the result.
    const computed = await precomputeUserCategoryRecommendations(userId, category, {
      topN: scoringWeights.topN,
    });
    source = computed.source === 'cold_start' ? 'cold_start' : 'realtime';
    generatedAt = computed.generatedAt;
    rows = computed.items.slice(0, limit).map((item, index) => ({
      movieId: String(item.movie.id),
      score: item.score,
      rank: index + 1,
      generatedAt,
    }));
  } else {
    generatedAt = rows[0]?.generatedAt || null;
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
    items,
  };

  if (hydrate) {
    const movies = await findMoviesByIdsPreserveOrder(items.map((i) => i.movieId));
    const scoreById = new Map(items.map((i) => [String(i.movieId), i]));
    result.movies = movies.map((movie) => ({
      ...movie,
      recommendationScore: scoreById.get(String(movie.id))?.score ?? null,
      recommendationRank: scoreById.get(String(movie.id))?.rank ?? null,
    }));
  }

  return result;
};

module.exports = {
  parseUserId,
  getRecommendationsByCategory,
};
