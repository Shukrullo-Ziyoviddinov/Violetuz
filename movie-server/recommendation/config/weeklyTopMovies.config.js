/**
 * Haftaning top filmlari knobs.
 * Formula / progress gate / affinity scoringWeights ga kirmaydi.
 * UI komponent ichida bu raqamlar yozilmaydi — API shu configdan o‘qiydi.
 *
 * @module recommendation/config/weeklyTopMovies.config
 */

'use strict';

const weeklyTopMoviesConfig = Object.freeze({
  /** Ko‘rsatish chegarasi */
  topLimit: 10,
  topMaxLimit: 10,
  /** Rolling oyna (kun) */
  weeklyWindowDays: 7,
  /** Blokka kirish: kamida shuncha distinct “ko‘rildi” */
  minViews: 1,
});

module.exports = {
  weeklyTopMoviesConfig,
};
