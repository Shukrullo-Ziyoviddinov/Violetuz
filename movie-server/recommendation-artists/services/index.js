'use strict';

const artistWatchCount = require('./artistWatchCount.service');
const topArtists = require('./topArtists.service');
const popularArtistsRead = require('./popularArtistsRead.service');
const guestLocalHistorySanitize = require('./guestLocalHistory.sanitize');
const guestArtistScoreBuilder = require('./guestArtistScoreBuilder.service');
const guestRecommendedArtists = require('./guestRecommendedArtists.service');

module.exports = {
  applyCreditsFromListenedContent: artistWatchCount.applyCreditsFromListenedContent,
  getRecommendedArtists: artistWatchCount.getRecommendedArtists,
  getTrendingArtists: artistWatchCount.getTrendingArtists,
  getTopArtists: topArtists.getTopArtists,
  getWeeklyTopArtists: topArtists.getWeeklyTopArtists,
  getPopularArtists: popularArtistsRead.getPopularArtists,
  sanitizeGuestLocalHistory: guestLocalHistorySanitize.sanitizeLocalHistory,
  buildGuestArtistScoresFromEvents: guestArtistScoreBuilder.buildArtistScoresFromEvents,
  buildGuestArtistScoresFromLocalHistory: guestArtistScoreBuilder.buildFromLocalHistory,
  getGuestRecommendedArtists: guestRecommendedArtists.getGuestRecommendedArtists,
};
