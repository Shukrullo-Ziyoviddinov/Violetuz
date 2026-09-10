/**
 * Recommended-actors knobs (isolated from movie affinity scoring).
 * Gate for "ko'rildi" stays in recommendation/progress (min 5 daqiqa).
 *
 * @module recommendation-actors/config/scoringWeights
 */

'use strict';

const scoringWeights = Object.freeze({
  minMovieCount: 2,
  defaultLimit: 40,
  maxLimit: 80,
  /** Global trending window (days) for cold-start. */
  trendingWindowDays: 30,
  /** TopActors leaderboard size */
  topLimit: 10,
  topMaxLimit: 20,
});

module.exports = { scoringWeights };
