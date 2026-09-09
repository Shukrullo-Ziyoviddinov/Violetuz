/**
 * Recommended-artists knobs (isolated from music affinity scoring).
 * Gate: recommendation-music progress (≥10s) across music|clip|concert|album.
 *
 * @module recommendation-artists/config/scoringWeights
 */

'use strict';

const scoringWeights = Object.freeze({
  /** Distinct listened/watched contents with same artistId before listing */
  minContentCount: 2,
  defaultLimit: 40,
  maxLimit: 80,
  /** Global trending window (days) for cold-start. */
  trendingWindowDays: 30,
});

module.exports = { scoringWeights };
