/**
 * TopArtists leaderboard — thin wrapper over global artist trending.
 * No duplicate +1 logic; same credits as recommended-artists trending.
 *
 * @module recommendation-artists/services/topArtists.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { resolveTopLimit, withRanks } = require('../../recommendation-shared/topRanking');
const { getTrendingArtists } = require('./artistWatchCount.service');

/**
 * Global Top-N artists by distinct user×content listen credits.
 * @param {{ limit?: number, windowDays?: number }} [opts]
 */
const getTopArtists = async (opts = {}) => {
  const limit = resolveTopLimit(opts.limit, {
    defaultLimit: scoringWeights.topLimit,
    maxLimit: scoringWeights.topMaxLimit,
  });

  const trending = await getTrendingArtists({
    limit,
    windowDays: opts.windowDays,
  });

  const artists = withRanks(trending.artists || []);

  return {
    artists,
    limit,
    windowDays: trending.windowDays,
    source: artists.length ? 'top_artists' : 'empty',
  };
};

module.exports = {
  getTopArtists,
};
