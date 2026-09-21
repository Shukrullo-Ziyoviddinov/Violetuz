/**
 * Mashhur albomlar knobs (oylik rolling oyna).
 * Formula / progress gate / affinity scoringWeights ga kirmaydi.
 * Tartib formulasi bu yerda emas — shared ranker + ListenEvent stats.
 * Faqat contentType: album.
 *
 * @module recommendation-music/config/popularAlbums.config
 */

'use strict';

const popularAlbumsConfig = Object.freeze({
  /** Ko‘rsatish chegarasi */
  topLimit: 20,
  topMaxLimit: 20,
  /** Rolling oyna (kun) — oy top music bilan bir xil */
  windowDays: 30,
  /** Blokka kirish: kamida shuncha distinct “tinglandi” */
  minViews: 1,
  /** Faqat albomlar — ListenEvent.contentType */
  contentType: 'album',
});

module.exports = {
  popularAlbumsConfig,
};
