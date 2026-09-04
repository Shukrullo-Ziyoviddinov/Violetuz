/**
 * Services barrel — namespaced modules + curated flat API.
 *
 * Inside the engine: `require('./foo.service')`.
 * Outside: `services.scoring.*` or curated names below.
 * Do NOT silent-spread every export.
 *
 * @module recommendation/services
 */

'use strict';

const scoring = require('./scoring.service');
const affinity = require('./affinity.service');
const watchEvent = require('./watchEvent.service');
const diversity = require('./diversity.service');
const precompute = require('./precompute.service');
const serve = require('./serve.service');
const likeHook = require('./likeHook.service');
const unlikeHook = require('./unlikeHook.service');
const progress = require('./progress.service');
const trending = require('./trending.service');
const blending = require('./blending.service');

/** Full modules — use for helpers not on the curated flat API. */
const namespaces = Object.freeze({
  scoring,
  affinity,
  watchEvent,
  diversity,
  precompute,
  serve,
  likeHook,
  unlikeHook,
  progress,
  trending,
  blending,
});

/**
 * Curated flat surface (HTTP wiring + verify + common library).
 * Removed / never flat-exported (use namespaces):
 *   rankTopN, getBlendedScore, getCachedTopN, computeTrendingScore,
 *   loadAffinityMap, ensureJobsRegistered, isEligibleProgress,
 *   hasPersonalizationSignal, isUserRecommendationCacheStale,
 *   resolveEffectiveRepeatPenalty, buildPopularityFallbackScores
 * Deleted: enqueueMovieWatchHook (use reportMovieProgress / recordWatchEvent).
 */
const api = Object.freeze({
  scoreMovie: scoring.scoreMovie,
  scoreMovies: scoring.scoreMovies,
  scoreColdStart: scoring.scoreColdStart,

  resolveBoost: affinity.resolveBoost,
  applyWatchToAffinities: affinity.applyWatchToAffinities,
  applyLikeToAffinities: affinity.applyLikeToAffinities,
  applyUnlikeToAffinities: affinity.applyUnlikeToAffinities,

  recordWatchEvent: watchEvent.recordWatchEvent,

  diversifyRecommendations: diversity.diversifyRecommendations,
  measureDiversityShares: diversity.measureDiversityShares,

  precomputeUserCategoryRecommendations: precompute.precomputeUserCategoryRecommendations,
  getRecommendationsByCategory: serve.getRecommendationsByCategory,
  reportMovieProgress: progress.reportMovieProgress,

  enqueueMovieLikeHook: likeHook.enqueueMovieLikeHook,
  enqueueMovieUnlikeHook: unlikeHook.enqueueMovieUnlikeHook,

  scoreTrendingBatch: trending.scoreTrendingBatch,
  resolveTrendingScore: trending.resolveTrendingScore,

  calculateAlpha: blending.calculateAlpha,
  blendScores: blending.blendScores,
  minMaxNormalizeList: blending.minMaxNormalizeList,
  normalizePersonalLone: blending.normalizePersonalLone,
  scoreMoviesBlended: blending.scoreMoviesBlended,
});

module.exports = {
  ...namespaces,
  ...api,
};
