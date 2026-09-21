/**
 * Mashhur artistlar knobs (oylik rolling oyna).
 * Formula / credit yozuvi bu yerda emas — mavjud artist credit aggregation.
 * Weekly topArtists knobs (scoringWeights) ga aralashmaydi.
 *
 * @module recommendation-artists/config/popularArtists.config
 */

'use strict';

const popularArtistsConfig = Object.freeze({
  /** Ko‘rsatish chegarasi */
  topLimit: 20,
  topMaxLimit: 20,
  /** Rolling oyna (kun) — haftalik 7 ning oylik jufti */
  windowDays: 30,
});

module.exports = {
  popularArtistsConfig,
};
