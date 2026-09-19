/**
 * Oyning top musiqalari knobs.
 * Formula / progress gate / affinity scoringWeights ga kirmaydi.
 * Tartib formulasi bu yerda emas — shared ranker + ListenEvent stats.
 * Faqat contentType: music (clip / concert / album keyin alohida).
 *
 * @module recommendation-music/config/monthlyTopMusic.config
 */

'use strict';

const monthlyTopMusicConfig = Object.freeze({
  /** Ko‘rsatish chegarasi */
  topLimit: 10,
  topMaxLimit: 10,
  /** Rolling oyna (kun). Haftadagi 7 ning oylik jufti. */
  windowDays: 30,
  /** Blokka kirish: kamida shuncha distinct “eshitildi” */
  minViews: 1,
  /** Faqat qo‘shiqlar — ListenEvent.contentType */
  contentType: 'music',
});

module.exports = {
  monthlyTopMusicConfig,
};
