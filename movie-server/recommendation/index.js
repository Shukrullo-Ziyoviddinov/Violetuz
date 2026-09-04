/**
 * Category-based personalized recommendation engine (isolated module).
 *
 * Folder layout:
 *   recommendation/
 *   ├── config/          scoringWeights.js
 *   ├── types/           JSDoc typedefs
 *   ├── dimensions/      AffinityDimension registry
 *   ├── models/          WatchEvent, UserAffinity, UserRecommendation, …
 *   ├── repositories/    DB access
 *   ├── services/        namespaced + curated public API
 *   ├── jobs/            async affinity + Top-N + trending
 *   ├── utils/           clamp, decay, combo helpers
 *   ├── controllers/     HTTP layer
 *   ├── routes/          Express router
 *   └── index.js         this file — curated package exports
 *
 * Mount: routes/index.js → /api/recommendations
 *
 * Public contract (prefer these):
 *   - routes                         Express router
 *   - reportMovieProgress            POST /progress path (also callable)
 *   - getRecommendationsByCategory   GET /:category path
 *   - enqueueMovieLikeHook / Unlike  reaction.service wiring
 *   - scoringWeights / dimensions    config + extension
 *   - services.* namespaces          advanced / tests
 *
 * Extension (optional):
 *   - createDimension / registerDimension
 *
 * Not exported (use services.<ns>.* or deep require):
 *   rankTopN, getBlendedScore, getCachedTopN, computeTrendingScore,
 *   getDimensionByType, getDimensionWeight, model shortcuts duplicates
 *
 * Removed (dead / footgun):
 *   enqueueMovieWatchHook — use POST /recommendations/progress
 *
 * @module recommendation
 */

'use strict';

const { scoringWeights } = require('./config/scoringWeights');
const {
  dimensions,
  createDimension,
  registerDimension,
  extractAllDimensionValues,
  scoreDimension,
  scoreAllDimensions,
} = require('./dimensions');
const utils = require('./utils');
const services = require('./services');
const models = require('./models');
const repositories = require('./repositories');
const jobs = require('./jobs');
const routes = require('./routes');

module.exports = {
  // --- HTTP ---
  routes,

  // --- Config / dimension registry ---
  scoringWeights,
  dimensions,
  createDimension,
  registerDimension,
  extractAllDimensionValues,
  scoreDimension,
  scoreAllDimensions,

  // --- Namespaced access ---
  utils,
  services,
  models,
  repositories,
  jobs,

  // --- Production library ---
  reportMovieProgress: services.reportMovieProgress,
  getRecommendationsByCategory: services.getRecommendationsByCategory,
  enqueueMovieLikeHook: services.enqueueMovieLikeHook,
  enqueueMovieUnlikeHook: services.enqueueMovieUnlikeHook,
  precomputeUserCategoryRecommendations: services.precomputeUserCategoryRecommendations,
  recommendationQueue: jobs.recommendationQueue,

  // --- Scoring / diversity (verify + advanced) ---
  scoreMovie: services.scoreMovie,
  scoreMovies: services.scoreMovies,
  scoreColdStart: services.scoreColdStart,
  diversifyRecommendations: services.diversifyRecommendations,
  measureDiversityShares: services.measureDiversityShares,
  resolveBoost: services.resolveBoost,
  applyWatchToAffinities: services.applyWatchToAffinities,
  applyLikeToAffinities: services.applyLikeToAffinities,
  applyUnlikeToAffinities: services.applyUnlikeToAffinities,
  recordWatchEvent: services.recordWatchEvent,

  // --- Blending / trending (verify + advanced) ---
  calculateAlpha: services.calculateAlpha,
  blendScores: services.blendScores,
  minMaxNormalizeList: services.minMaxNormalizeList,
  normalizePersonalLone: services.normalizePersonalLone,
  scoreMoviesBlended: services.scoreMoviesBlended,
  scoreTrendingBatch: services.scoreTrendingBatch,
  resolveTrendingScore: services.resolveTrendingScore,
};
