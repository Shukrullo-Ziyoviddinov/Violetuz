/**
 * Recommendation Mongoose models (isolated from movie-server/models).
 * Movie catalog is read-only via existing Movie.model — never mutated here.
 *
 * @module recommendation/models
 */

'use strict';

const WatchEvent = require('./WatchEvent.model');
const UserAffinity = require('./UserAffinity.model');
const UserRecommendation = require('./UserRecommendation.model');
const UserMovieProgress = require('./UserMovieProgress.model');

module.exports = {
  WatchEvent,
  UserAffinity,
  UserRecommendation,
  UserMovieProgress,
  KNOWN_DIMENSION_TYPES: UserAffinity.KNOWN_DIMENSION_TYPES,
};
