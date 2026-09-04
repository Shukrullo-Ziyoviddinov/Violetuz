/**
 * Category-based personalized recommendation engine (isolated module).
 *
 * Folder layout:
 *   recommendation/
 *   ├── config/          scoringWeights.js
 *   ├── types/           JSDoc typedefs
 *   ├── dimensions/      AffinityDimension registry
 *   ├── models/          WatchEvent, UserAffinity, UserRecommendation
 *   ├── repositories/    DB access
 *   ├── services/        affinity, scoring, diversity, serve
 *   ├── jobs/            async affinity + Top-N precompute
 *   ├── utils/           clamp, decay, combo helpers
 *   ├── controllers/     HTTP layer
 *   ├── routes/          Express router
 *   └── index.js         public barrel
 *
 * Not wired into app.js directly — mounted via routes/index.js → /recommendations.
 *
 * @module recommendation
 */

'use strict';

const { scoringWeights } = require('./config/scoringWeights');
const {
  dimensions,
  createDimension,
  registerDimension,
  getDimensionByType,
  getDimensionWeight,
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
  scoringWeights,
  dimensions,
  createDimension,
  registerDimension,
  getDimensionByType,
  getDimensionWeight,
  extractAllDimensionValues,
  scoreDimension,
  scoreAllDimensions,
  utils,
  services,
  models,
  repositories,
  jobs,
  WatchEvent: models.WatchEvent,
  UserAffinity: models.UserAffinity,
  UserRecommendation: models.UserRecommendation,
  UserMovieProgress: models.UserMovieProgress,
  scoreMovie: services.scoreMovie,
  scoreMovies: services.scoreMovies,
  scoreColdStart: services.scoreColdStart,
  rankTopN: services.rankTopN,
  recordWatchEvent: services.recordWatchEvent,
  reportMovieProgress: services.reportMovieProgress,
  applyWatchToAffinities: services.applyWatchToAffinities,
  applyLikeToAffinities: services.applyLikeToAffinities,
  applyUnlikeToAffinities: services.applyUnlikeToAffinities,
  diversifyRecommendations: services.diversifyRecommendations,
  measureDiversityShares: services.measureDiversityShares,
  precomputeUserCategoryRecommendations: services.precomputeUserCategoryRecommendations,
  getCachedTopN: services.getCachedTopN,
  getRecommendationsByCategory: services.getRecommendationsByCategory,
  enqueueMovieWatchHook: services.enqueueMovieWatchHook,
  enqueueMovieLikeHook: services.enqueueMovieLikeHook,
  enqueueMovieUnlikeHook: services.enqueueMovieUnlikeHook,
  recommendationQueue: jobs.recommendationQueue,
  routes,
};
