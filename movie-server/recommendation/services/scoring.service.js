/**
 * Final movie scoring formula (additive dimensions + global signals − watched penalty).
 *
 * finalScore =
 *   Σ (w_dim * avgAffinity(dim))
 * + w_popularity * popularity
 * + w_rating * rating
 * + w_recency * recency
 * − watchedPenalty
 *
 * Cold-start (no affinity): only popularity + rating + recency.
 *
 * @module recommendation/services/scoring.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { scoreAllDimensions, dimensions } = require('../dimensions');
const { toDecayedAffinityMap } = require('../utils/decay');
const {
  getPopularitySignal,
  getRatingSignal,
  getRecencySignal,
} = require('../utils/movieSignals');

/**
 * @param {import('../types/recommendation.types').AffinityMap} affinityMap
 * @returns {boolean}
 */
const hasPersonalizationSignal = (affinityMap) => {
  if (!affinityMap || typeof affinityMap !== 'object') return false;

  for (const values of Object.values(affinityMap)) {
    if (!values || typeof values !== 'object') continue;
    for (const score of Object.values(values)) {
      if (typeof score === 'number' && score > 0) return true;
    }
  }
  return false;
};

/**
 * @param {Set<string|number>|Array<string|number>|undefined} watchedIds
 * @returns {Set<string>}
 */
const toWatchedSet = (watchedIds) => {
  if (!watchedIds) return new Set();
  if (watchedIds instanceof Set) {
    return new Set([...watchedIds].map((id) => String(id)));
  }
  return new Set([...watchedIds].map((id) => String(id)));
};

/**
 * @param {Object.<string, number>} byType
 * @param {number} popularity
 * @param {number} rating
 * @param {number} recency
 * @param {number} watchedPenalty
 * @param {number} finalScore
 * @param {boolean} coldStart
 * @returns {import('../types/recommendation.types').ScoreBreakdown & { coldStart: boolean, byType: Object.<string, number> }}
 */
const buildBreakdown = (byType, popularity, rating, recency, watchedPenalty, finalScore, coldStart) => ({
  genre: byType.genre || 0,
  country: byType.country || 0,
  actor: byType.actor || 0,
  comboGenreCountry: byType.genre_country || 0,
  comboGenreActor: byType.genre_actor || 0,
  popularity,
  rating,
  recency,
  watchedPenalty,
  final: finalScore,
  coldStart,
  byType,
});

/**
 * Score a single movie.
 *
 * @param {import('../types/recommendation.types').Movie} movie
 * @param {Object} [options]
 * @param {import('../types/recommendation.types').AffinityMap|Object} [options.affinityMap]
 * @param {Set<string|number>|Array<string|number>} [options.watchedIds]
 * @param {boolean} [options.includeBreakdown=false]
 * @param {Date|number} [options.now]
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [options.weights]
 * @param {import('../types/recommendation.types').AffinityDimension[]} [options.dims]
 * @returns {import('../types/recommendation.types').ScoredMovie & { coldStart?: boolean }}
 */
const scoreMovie = (movie, options = {}) => {
  const {
    affinityMap: rawAffinity = {},
    watchedIds,
    includeBreakdown = false,
    now = Date.now(),
    weights = scoringWeights,
    dims = dimensions,
  } = options;

  const nowMs = now instanceof Date ? now.getTime() : now;
  const affinityMap = toDecayedAffinityMap(rawAffinity, nowMs, weights.decay);
  const coldStart = !hasPersonalizationSignal(affinityMap);

  const dimResult = coldStart
    ? { total: 0, byType: {} }
    : scoreAllDimensions(movie, affinityMap, dims, weights);

  const popularity = getPopularitySignal(movie);
  const rating = getRatingSignal(movie);
  const recency = getRecencySignal(movie, new Date(nowMs));

  const watched = toWatchedSet(watchedIds).has(String(movie?.id));
  const watchedPenalty = watched ? weights.watchedPenalty : 0;

  const finalScore =
    dimResult.total +
    weights.popularity * popularity +
    weights.rating * rating +
    weights.recency * recency -
    watchedPenalty;

  /** @type {import('../types/recommendation.types').ScoredMovie & { coldStart: boolean }} */
  const result = {
    movie,
    score: finalScore,
    coldStart,
  };

  if (includeBreakdown) {
    result.breakdown = buildBreakdown(
      dimResult.byType,
      popularity,
      rating,
      recency,
      watchedPenalty,
      finalScore,
      coldStart
    );
  }

  return result;
};

/**
 * Score and sort a candidate list (highest first). Does not full-scan strategy —
 * caller should pass a filtered category candidate pool.
 *
 * @param {import('../types/recommendation.types').Movie[]} movies
 * @param {Object} [options] — same as scoreMovie options
 * @returns {import('../types/recommendation.types').ScoredMovie[]}
 */
const scoreMovies = (movies, options = {}) => {
  if (!Array.isArray(movies) || movies.length === 0) return [];

  const scored = movies.map((movie) => scoreMovie(movie, options));
  scored.sort((a, b) => b.score - a.score);
  return scored;
};

/**
 * Cold-start ranking: popularity + rating + recency only.
 * Always returns a list (never empty error) when movies are provided.
 *
 * @param {import('../types/recommendation.types').Movie[]} movies
 * @param {Object} [options]
 * @returns {import('../types/recommendation.types').ScoredMovie[]}
 */
const scoreColdStart = (movies, options = {}) =>
  scoreMovies(movies, {
    ...options,
    affinityMap: {},
  });

/**
 * Take Top-N after scoring.
 *
 * @param {import('../types/recommendation.types').Movie[]} movies
 * @param {Object} [options]
 * @param {number} [options.limit]
 * @returns {import('../types/recommendation.types').ScoredMovie[]}
 */
const rankTopN = (movies, options = {}) => {
  const limit = options.limit ?? scoringWeights.topN;
  return scoreMovies(movies, options).slice(0, Math.max(0, limit));
};

module.exports = {
  hasPersonalizationSignal,
  scoreMovie,
  scoreMovies,
  scoreColdStart,
  rankTopN,
};
