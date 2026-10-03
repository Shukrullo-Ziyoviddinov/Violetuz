/**
 * Music / klip / albom "shunga o'xshash" sozlamasi.
 *
 * Alohida modul (music-similar). movie-similar / recommendation /
 * recommendation-music / music-home-feed / music-mixes ga ulanmaydi.
 *
 * @module music-similar/config/similarityWeights
 */

'use strict';

/**
 * Barcha sonlar va maydon nomlari shu yerda.
 * Keyingi qadamlar (engine, job, API) shu configdan o'qiydi.
 */
const similarityWeights = {
  /** GET similar default limit (Q1+Q2+Q3 interleave shu ichida). */
  limit: 10,

  /** QATLAM 1 — franshiza max (music/klip). Albumda Q1 yo'q. */
  q1Max: 4,

  /** QATLAM 2 — artist + genre hard match max. */
  q2Max: 3,

  /**
   * ContentType bo'yicha franshiza maydoni.
   * Album / concert — maydon yo'q (Q1 skip).
   */
  franchiseFieldByType: Object.freeze({
    music: 'franchiseMusicIds',
    klip: 'franchiseClipIds',
  }),

  /** Similar qo'llab-quvvatlanadigan type lar (concert yo'q). */
  contentTypes: Object.freeze(['music', 'klip', 'album']),

  /** Cache qatorlaridagi layer belgilari. */
  layers: Object.freeze({
    franchise: 'franchise',
    artistGenre: 'artist_genre',
    general: 'general',
  }),

  /**
   * QATLAM 3 — soft skor vaznlari.
   * Artist soft YO'Q (artist faqat Q2 hard). Q3 = boshqa artistlar.
   * w1 genre, w2 year, w3 country, w4 language.
   */
  general: Object.freeze({
    w1Genre: 0.5,
    w2Year: 0.2,
    w3Country: 0.15,
    w4Language: 0.15,
  }),

  /** To'liq katalog precompute oralig'i (ms). */
  precomputeIntervalMs: 12 * 60 * 60 * 1000,
};

module.exports = {
  similarityWeights,
};
