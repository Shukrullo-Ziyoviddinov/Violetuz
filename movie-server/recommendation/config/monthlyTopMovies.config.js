/**
 * Oyning top filmlari knobs.
 * Tartib formulasi bu yerda emas — weekly ranker chaqiriladi.
 *
 * @module recommendation/config/monthlyTopMovies.config
 */

'use strict';

const monthlyTopMoviesConfig = Object.freeze({
  topLimit: 10,
  topMaxLimit: 10,
  /** Rolling oyna (kun). Haftadagi 7 ning oylik jufti. */
  windowDays: 30,
  minViews: 1,
});

module.exports = {
  monthlyTopMoviesConfig,
};
