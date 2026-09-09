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
});

module.exports = { scoringWeights };
