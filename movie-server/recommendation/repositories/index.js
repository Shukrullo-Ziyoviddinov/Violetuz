/**
 * Recommendation repositories barrel.
 * @module recommendation/repositories
 */

'use strict';

const movieProjectionRepository = require('./movieProjection.repository');
const watchEventRepository = require('./watchEvent.repository');
const userAffinityRepository = require('./userAffinity.repository');
const userRecommendationRepository = require('./userRecommendation.repository');
const userMovieProgressRepository = require('./userMovieProgress.repository');

module.exports = {
  ...movieProjectionRepository,
  ...watchEventRepository,
  ...userAffinityRepository,
  ...userRecommendationRepository,
  ...userMovieProgressRepository,
};
