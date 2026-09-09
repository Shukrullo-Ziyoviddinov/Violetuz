'use strict';

const actorWatchCount = require('./actorWatchCount.service');

module.exports = {
  applyCreditsFromWatchedMovie: actorWatchCount.applyCreditsFromWatchedMovie,
  getRecommendedActors: actorWatchCount.getRecommendedActors,
  getTrendingActors: actorWatchCount.getTrendingActors,
};
