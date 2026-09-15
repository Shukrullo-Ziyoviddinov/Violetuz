'use strict';

const actorWatchCount = require('./actorWatchCount.service');
const topActors = require('./topActors.service');
const guestLocalHistorySanitize = require('./guestLocalHistory.sanitize');
const guestActorScoreBuilder = require('./guestActorScoreBuilder.service');
const guestRecommendedActors = require('./guestRecommendedActors.service');

module.exports = {
  applyCreditsFromWatchedMovie: actorWatchCount.applyCreditsFromWatchedMovie,
  getRecommendedActors: actorWatchCount.getRecommendedActors,
  getTrendingActors: actorWatchCount.getTrendingActors,
  getTopActors: topActors.getTopActors,
  getWeeklyTopActors: topActors.getWeeklyTopActors,
  sanitizeGuestLocalHistory: guestLocalHistorySanitize.sanitizeLocalHistory,
  buildGuestActorScoresFromEvents: guestActorScoreBuilder.buildActorScoresFromEvents,
  buildGuestActorScoresFromLocalHistory: guestActorScoreBuilder.buildFromLocalHistory,
  getGuestRecommendedActors: guestRecommendedActors.getGuestRecommendedActors,
};
