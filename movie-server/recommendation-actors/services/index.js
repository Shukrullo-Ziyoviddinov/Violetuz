'use strict';

const actorWatchCount = require('./actorWatchCount.service');
const topActors = require('./topActors.service');

module.exports = {
  applyCreditsFromWatchedMovie: actorWatchCount.applyCreditsFromWatchedMovie,
  getRecommendedActors: actorWatchCount.getRecommendedActors,
  getTrendingActors: actorWatchCount.getTrendingActors,
  getTopActors: topActors.getTopActors,
};
