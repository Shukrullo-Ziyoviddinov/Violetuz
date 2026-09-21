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
 * @param {{
 *   limit?: number,
 *   windowDays?: number,
 *   defaultLimit?: number,
 *   maxLimit?: number,
 * }} [opts]
 * `defaultLimit` / `maxLimit` — product adapters (weekly/popular) o‘z knoblarini berishi mumkin;
 * berilmasa scoringWeights (top leaderboard) ishlatiladi.
 */
const getTopArtists = async (opts = {}) => {
  const limit = resolveTopLimit(opts.limit, {
    defaultLimit: opts.defaultLimit ?? scoringWeights.topLimit,
    maxLimit: opts.maxLimit ?? scoringWeights.topMaxLimit,
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

/**
 * Haftaning Top-N — same credits, rolling 7-day window.
 * @param {{ limit?: number, windowDays?: number }} [opts]
 */
const getWeeklyTopArtists = async (opts = {}) => {
  const windowDays =
    Number(opts.windowDays) > 0
      ? Number(opts.windowDays)
      : scoringWeights.weeklyWindowDays ?? 7;

  const result = await getTopArtists({
    limit: opts.limit,
    windowDays,
  });

  return {
    ...result,
    source: result.artists?.length ? 'weekly_top_artists' : 'empty',
  };
};

module.exports = {
  getTopArtists,
  getWeeklyTopArtists,
};
