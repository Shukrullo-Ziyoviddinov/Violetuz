/**
 * Category-based personalized music recommendation engine (isolated module).
 *
 * Mount: routes/index.js → /api/music-recommendations
 *
 * Collections (music_* prefix — never writes movie recommendation_*):
 *   music_recommendation_listen_events
 *   music_recommendation_user_progress
 *   music_recommendation_user_affinity
 *   music_recommendation_user_recommendations
 *
 * V1: personal + cold-start (no trending/blend).
 * Likes: clip/concert only.
 *
 * @module recommendation-music
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
  routes,

  scoringWeights,
  dimensions,
  createDimension,
  registerDimension,
  extractAllDimensionValues,
  scoreDimension,
  scoreAllDimensions,

  utils,
  services,
  models,
  repositories,
  jobs,

  reportMusicProgress: services.reportMusicProgress,
  getRecommendationsByCategory: services.getRecommendationsByCategory,
  enqueueMusicLikeHook: services.enqueueMusicLikeHook,
  enqueueMusicUnlikeHook: services.enqueueMusicUnlikeHook,
  precomputeUserCategoryRecommendations: services.precomputeUserCategoryRecommendations,
  musicRecommendationQueue: jobs.musicRecommendationQueue,
  /** @deprecated alias — use musicRecommendationQueue */
  recommendationQueue: jobs.musicRecommendationQueue,

  scoreContent: services.scoreContent,
  scoreContents: services.scoreContents,
  scoreColdStart: services.scoreColdStart,
  diversifyRecommendations: services.diversifyRecommendations,
  applyListenToAffinities: services.applyListenToAffinities,
  applyLikeToAffinities: services.applyLikeToAffinities,
  applyUnlikeToAffinities: services.applyUnlikeToAffinities,
  recordListenEvent: services.recordListenEvent,
};
