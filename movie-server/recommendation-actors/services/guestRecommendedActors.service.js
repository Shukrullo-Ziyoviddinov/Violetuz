/**
 * Guest recommended actors — same distinct-movie score as login,
 * from localHistory (stateless). NEVER writes actor credit/score collections.
 *
 * @module recommendation-actors/services/guestRecommendedActors.service
 */

'use strict';

const { findMoviesByIdsPreserveOrder } = require('../../recommendation/repositories/movieProjection.repository');
const { buildFromLocalHistory } = require('./guestActorScoreBuilder.service');
const { badRequest } = require('../../utils/errors');

/**
 * POST /api/recommended-actors/guest
 *
 * @param {Object} params
 * @param {unknown} params.localHistory — FE violet_guest_movies_v1 rows
 * @param {number} [params.limit]
 * @param {number} [params.minScore]
 * @returns {Promise<{
 *   userId: null,
 *   actors: Array<{ actorId: string, score: number }>,
 *   minScore: number,
 *   limit: number,
 *   source: string,
 *   creditedMovieCount: number
 * }>}
 */
const getGuestRecommendedActors = async (params = {}) => {
  const nowMs = Date.now();

  // Validate before catalog hydrate
  const preview = buildFromLocalHistory(params.localHistory, {
    moviesById: new Map(),
    nowMs,
    limit: params.limit,
    minScore: params.minScore,
  });
  if (!preview.ok) {
    throw badRequest(preview.error);
  }

  const historyIds = preview.events.map((e) => e.m);
  const historyMovies = historyIds.length
    ? await findMoviesByIdsPreserveOrder(historyIds)
    : [];

  const moviesById = new Map();
  for (const movie of historyMovies) {
    if (movie?.id == null) continue;
    moviesById.set(movie.id, movie);
    moviesById.set(String(movie.id), movie);
  }

  const built = buildFromLocalHistory(params.localHistory, {
    moviesById,
    nowMs,
    limit: params.limit,
    minScore: params.minScore,
  });
  if (!built.ok) {
    throw badRequest(built.error);
  }

  return {
    userId: null,
    actors: built.actors,
    minScore: built.minScore,
    limit: built.limit,
    source: built.source.startsWith('guest_')
      ? built.source
      : built.actors.length
        ? 'guest_actor_watch_score'
        : 'guest_empty',
    creditedMovieCount: built.creditedMovieCount,
  };
};

module.exports = {
  getGuestRecommendedActors,
};
