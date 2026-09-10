'use strict';

const artistWatchCount = require('./artistWatchCount.service');
const topArtists = require('./topArtists.service');

module.exports = {
  applyCreditsFromListenedContent: artistWatchCount.applyCreditsFromListenedContent,
  getRecommendedArtists: artistWatchCount.getRecommendedArtists,
  getTrendingArtists: artistWatchCount.getTrendingArtists,
  getTopArtists: topArtists.getTopArtists,
};
