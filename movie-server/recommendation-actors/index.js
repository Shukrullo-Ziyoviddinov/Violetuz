/**
 * Recommended actors engine (isolated from movie affinity / scoring).
 *
 * Mount: /api/recommended-actors
 *
 * Collections:
 *   recommendation_user_actor_movie_credits  — idempotent user×movie credit
 *   recommendation_user_actor_watch_scores   — actor distinct-movie counts
 *
 * "Ko'rildi" gate: recommendation progress (≥5 daqiqa). This module only +1s cast.
 * Music artists: recommendation-artists (shared entityDistinctCount core).
 *
 * @module recommendation-actors
 */

'use strict';

const { scoringWeights } = require('./config/scoringWeights');
const models = require('./models');
const services = require('./services');
const routes = require('./routes');

module.exports = {
  routes,
  scoringWeights,
  models,
  services,
  applyCreditsFromWatchedMovie: services.applyCreditsFromWatchedMovie,
  getRecommendedActors: services.getRecommendedActors,
};
