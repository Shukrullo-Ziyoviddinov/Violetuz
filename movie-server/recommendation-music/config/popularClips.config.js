/**
 * Mashhur kliplar knobs (oylik rolling oyna).
 * Formula / progress gate / affinity scoringWeights ga kirmaydi.
 * Tartib formulasi bu yerda emas — shared ranker + ListenEvent stats.
 * Faqat contentType: clip.
 *
 * @module recommendation-music/config/popularClips.config
 */

'use strict';

const popularClipsConfig = Object.freeze({
  /** Ko‘rsatish chegarasi */
  topLimit: 20,
  topMaxLimit: 20,
  /** Rolling oyna (kun) — mashhur albom / oy top music bilan bir xil */
  windowDays: 30,
  /** Blokka kirish: kamida shuncha distinct “ko‘rildi” */
  minViews: 1,
  /** Faqat kliplar — ListenEvent.contentType */
  contentType: 'clip',
});

module.exports = {
  popularClipsConfig,
};
