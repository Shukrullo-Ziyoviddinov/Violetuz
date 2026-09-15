/**
 * Guest recommendations — same scoring/trending/blend as login precompute,
 * but affinity from localHistory (stateless). NEVER writes user_* collections.
 *
 * @module recommendation/services/guestRecommendations.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { hasPersonalizationSignal } = require('./scoring.service');
const { scoreMoviesBlended } = require('./blending.service');
const { diversifyRecommendations } = require('./diversity.service');
const { buildCategoryCandidatePool, findMoviesByIdsPreserveOrder } = require('../repositories/movieProjection.repository');
const {
  buildFromEvents,
  guestHistoryConfig,
} = require('./guestAffinityBuilder.service');
const { badRequest } = require('../../utils/errors');

/**
 * POST /api/recommendations/:category/guest
 *
 * @param {Object} params
 * @param {string} params.category
 * @param {unknown} params.localHistory
 * @param {number} [params.limit]
 * @param {boolean} [params.hydrate]
 */
const getGuestRecommendationsByCategory = async (params = {}) => {
  const category = String(params.category || '').trim();
  const limit = Math.max(
    1,
    Math.min(Number(params.limit) || scoringWeights.topN, scoringWeights.topN)
  );
  const hydrate = params.hydrate !== false;
  const nowMs = Date.now();

  if (!category) {
    throw badRequest('category majburiy');
  }

  // Pre-validate length / ids before any heavy work
  const preview = buildFromEvents(params.localHistory, {
    category,
    moviesById: new Map(),
    nowMs,
  });
  if (!preview.ok) {
    throw badRequest(preview.error);
  }

  const historyIds = preview.events.map((e) => e.m);
  const historyMovies = historyIds.length
    ? await findMoviesByIdsPreserveOrder(historyIds)
    : [];
  const moviesById = new Map(historyMovies.map((m) => [m.id, m]));

  const built = buildFromEvents(params.localHistory, {
    category,
    moviesById,
    nowMs,
  });
  if (!built.ok) {
    throw badRequest(built.error);
  }

  const { affinityMap, experienceCount, watchedIds } = built;
  const personalized = hasPersonalizationSignal(affinityMap);

  const popularLimit =
    scoringWeights.candidatePoolPopular ?? scoringWeights.candidatePoolSize ?? 300;
  const affinityLimit = scoringWeights.candidatePoolAffinity ?? 150;

  const movies = await buildCategoryCandidatePool(category, {
    affinityMap: personalized ? affinityMap : null,
    popularLimit,
    affinityLimit: personalized ? affinityLimit : 0,
    seedGenres: scoringWeights.affinitySeedGenres,
    seedCountries: scoringWeights.affinitySeedCountries,
    seedActors: scoringWeights.affinitySeedActors,
  });

  // Pass experienceCount explicitly — no userId → no DB experience lookup
  const scored = await scoreMoviesBlended(movies, {
    category,
    experienceCount,
    scoreOptions: {
      affinityMap,
      watchedIds,
      now: nowMs,
    },
  });

  const diversified = diversifyRecommendations(scored, { limit });
  const generatedAt = new Date(nowMs);
  const alpha = diversified[0]?.alpha ?? scored[0]?.alpha ?? 0;

  const items = diversified.map((item, index) => ({
    movieId: String(item.movie.id),
    score: item.score,
    rank: index + 1,
  }));

  /** @type {Object} */
  const result = {
    userId: null,
    category,
    source: personalized ? 'guest_blended' : 'guest_trending',
    generatedAt,
    queuedRefresh: false,
    alpha,
    experienceCount,
    historySize: preview.events.length,
    maxEntries: guestHistoryConfig.MAX_ENTRIES,
    items,
  };

  if (hydrate && items.length) {
    const docs = await findMoviesByIdsPreserveOrder(items.map((i) => i.movieId));
    const scoreById = new Map(items.map((i) => [String(i.movieId), i]));
    result.movies = docs.map((movie) => ({
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
  getGuestRecommendationsByCategory,
};
