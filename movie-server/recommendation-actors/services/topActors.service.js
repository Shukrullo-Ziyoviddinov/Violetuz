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

module.exports = {
  getTopActors,
};
