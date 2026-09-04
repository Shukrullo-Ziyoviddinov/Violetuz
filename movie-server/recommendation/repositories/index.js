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
const trendingRepository = require('./trending.repository');
const userExperienceRepository = require('./userExperience.repository');
const jobLockRepository = require('./jobLock.repository');

module.exports = {
  ...movieProjectionRepository,
  ...watchEventRepository,
  ...userAffinityRepository,
  ...userRecommendationRepository,
  ...userMovieProgressRepository,
  ...trendingRepository,
  ...userExperienceRepository,
  ...jobLockRepository,
};
