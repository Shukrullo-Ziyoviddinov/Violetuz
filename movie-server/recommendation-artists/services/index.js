'use strict';

const artistWatchCount = require('./artistWatchCount.service');

module.exports = {
  applyCreditsFromListenedContent: artistWatchCount.applyCreditsFromListenedContent,
  getRecommendedArtists: artistWatchCount.getRecommendedArtists,
};
