/**
 * Build recommended-actor scores from guest localHistory — DB write YO‘Q.
 * Login parity: distinct movieId → +1 per cast actor (entityDistinctCount),
 * then minScore filter. Catalog actors[] only (never client-forged cast).
 *
 * @module recommendation-actors/services/guestActorScoreBuilder.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { toEntityIdList } = require('../../recommendation-shared/entityDistinctCount');
const {
  sanitizeLocalHistory,
  guestHistoryConfig,
} = require('./guestLocalHistory.sanitize');

/**
 * @param {Map<string|number, Object>|Object} moviesById
 * @param {number} movieId
 * @returns {Object|null}
 */
const resolveMovie = (moviesById, movieId) => {
  if (!moviesById) return null;
  if (typeof moviesById.get === 'function') {
    return (
      moviesById.get(movieId) ||
      moviesById.get(String(movieId)) ||
      null
    );
  }
  return moviesById[movieId] || moviesById[String(movieId)] || null;
};

/**
 * Fold sanitized watch events into actor scores (memory only).
 *
 * @param {Array<{m:number,r:number,t:number}>} events
 * @param {Object} [params]
 * @param {Map<string|number, Object>|Object} [params.moviesById]
 * @param {number} [params.minScore]
 * @param {number} [params.limit]
 * @returns {{
 *   actors: Array<{ actorId: string, score: number }>,
 *   minScore: number,
 *   limit: number,
 *   creditedMovieCount: number,
 *   skippedUnknownMovies: number,
 *   source: string
 * }}
 */
const buildActorScoresFromEvents = (
  events,
  {
    moviesById = new Map(),
    minScore: minScoreOpt,
    limit: limitOpt,
  } = {}
) => {
  const configuredMin = scoringWeights.minMovieCount ?? 2;
  const requestedMin = Number(minScoreOpt);
  const minScore = Math.max(
    configuredMin,
    Number.isFinite(requestedMin) && requestedMin > 0 ? requestedMin : configuredMin
  );

  const defaultLimit = scoringWeights.defaultLimit ?? 40;
  const maxLimit = scoringWeights.maxLimit ?? 80;
  let limit = Number(limitOpt);
  if (!Number.isFinite(limit) || limit <= 0) limit = defaultLimit;
  limit = Math.min(maxLimit, Math.floor(limit));

  /** @type {Map<string, number>} */
  const scoreByActor = new Map();
  /** @type {Set<string>} */
  const creditedMovies = new Set();
  let skippedUnknownMovies = 0;

  if (!Array.isArray(events) || !events.length) {
    return {
      actors: [],
      minScore,
      limit,
      creditedMovieCount: 0,
      skippedUnknownMovies: 0,
      source: 'empty',
    };
  }

  for (const event of events) {
    const movieKey = String(event.m);
    if (!movieKey || creditedMovies.has(movieKey)) continue;

    const movie = resolveMovie(moviesById, event.m);
    if (!movie) {
      skippedUnknownMovies += 1;
      continue;
    }

    const actorIds = toEntityIdList(movie.actors);
    if (!actorIds.length) {
      // Still mark credited — login claims item even when later increment is empty;
      // here: no entities → skip credit so rewatch with future cast data could apply.
      // Prefer login parity on distinct movie: claim once regardless.
      creditedMovies.add(movieKey);
      continue;
    }

    creditedMovies.add(movieKey);
    for (const actorId of actorIds) {
      scoreByActor.set(actorId, (scoreByActor.get(actorId) || 0) + 1);
    }
  }

  const actors = [...scoreByActor.entries()]
    .filter(([, score]) => score >= minScore)
    .map(([actorId, score]) => ({ actorId, score }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.actorId).localeCompare(String(b.actorId));
    })
    .slice(0, limit);

  return {
    actors,
    minScore,
    limit,
    creditedMovieCount: creditedMovies.size,
    skippedUnknownMovies,
    source: actors.length ? 'guest_actor_watch_score' : 'empty',
  };
};

/**
 * Sanitize + build. Caller supplies moviesById (catalog hydrate in serve step).
 *
 * @param {unknown} localHistory
 * @param {Object} [options]
 * @returns {{ ok: true, events: Array, actors: Array, ... } | { ok: false, error: string }}
 */
const buildFromLocalHistory = (localHistory, options = {}) => {
  const sanitized = sanitizeLocalHistory(localHistory, {
    nowMs: options.nowMs,
    config: options.config || guestHistoryConfig,
  });
  if (!sanitized.ok) {
    return sanitized;
  }

  const built = buildActorScoresFromEvents(sanitized.events, {
    moviesById: options.moviesById || new Map(),
    minScore: options.minScore,
    limit: options.limit,
  });

  return {
    ok: true,
    events: sanitized.events,
    ...built,
  };
};

module.exports = {
  sanitizeLocalHistory,
  buildActorScoresFromEvents,
  buildFromLocalHistory,
  guestHistoryConfig,
};
