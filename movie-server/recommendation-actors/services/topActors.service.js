/**
 * TopActors leaderboard — thin wrapper over global actor trending.
 * No duplicate +1 logic; same credits as recommended-actors trending.
 *
 * @module recommendation-actors/services/topActors.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { resolveTopLimit, withRanks } = require('../../recommendation-shared/topRanking');
const { getTrendingActors } = require('./actorWatchCount.service');

/**
 * Global Top-N actors by distinct user×movie watch credits.
 * @param {{ limit?: number, windowDays?: number }} [opts]
 */
const getTopActors = async (opts = {}) => {
  const limit = resolveTopLimit(opts.limit, {
    defaultLimit: scoringWeights.topLimit,
    maxLimit: scoringWeights.topMaxLimit,
  });

  const trending = await getTrendingActors({
    limit,
    windowDays: opts.windowDays,
  });

  const actors = withRanks(trending.actors || []);

  return {
    actors,
    limit,
    windowDays: trending.windowDays,
    source: actors.length ? 'top_actors' : 'empty',
  };
};

/**
 * Haftaning Top-N — same credits, rolling 7-day window (no separate collection).
 * @param {{ limit?: number, windowDays?: number }} [opts]
 */
const getWeeklyTopActors = async (opts = {}) => {
  const windowDays =
    Number(opts.windowDays) > 0
      ? Number(opts.windowDays)
      : scoringWeights.weeklyWindowDays ?? 7;

  const result = await getTopActors({
    limit: opts.limit,
    windowDays,
  });

  return {
    ...result,
    source: result.actors?.length ? 'weekly_top_actors' : 'empty',
  };
};

module.exports = {
  getTopActors,
  getWeeklyTopActors,
};
