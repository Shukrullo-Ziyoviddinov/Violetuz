/**
 * Haftaning top musiqalari knobs.
 * Formula / progress gate / affinity scoringWeights ga kirmaydi.
 * UI komponent ichida bu raqamlar yozilmaydi — API shu configdan o‘qiydi.
 * Faqat contentType: music (clip / concert / album keyin alohida).
 *
 * @module recommendation-music/config/weeklyTopMusic.config
 */

'use strict';

const weeklyTopMusicConfig = Object.freeze({
  /** Ko‘rsatish chegarasi */
  topLimit: 10,
  topMaxLimit: 10,
  /** Rolling oyna (kun) */
  weeklyWindowDays: 7,
  /** Blokka kirish: kamida shuncha distinct “eshitildi” */
  minViews: 1,
  /** Faqat qo‘shiqlar — ListenEvent.contentType */
  contentType: 'music',
});

module.exports = {
  weeklyTopMusicConfig,
};
