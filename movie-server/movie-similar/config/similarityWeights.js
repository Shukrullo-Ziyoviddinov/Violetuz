/**
 * "Shunga o'xshash kinolar" sozlamasi.
 *
 * Alohida modul (movie-similar). recommendation / home-feed /
 * music-mixes / scoringWeights ga yozilmaydi.
 *
 * @module movie-similar/config/similarityWeights
 */

'use strict';

/**
 * Barcha sonlar va maydon nomlari shu yerda.
 * Keyingi qadamlar (engine, job, API) shu configdan o'qiydi.
 */
const similarityWeights = {
  /** GET similar default limit (Q1 franshiza kesilmaydi — limit asosan Q2+Q3 uchun). */
  limit: 20,

  /**
   * QATLAM 1 — kinodagi franshiza maydoni.
   * Array tartibi = ko'rsatish tartibi: birinchi id eng yuqorida.
   * Yil bo'yicha sort YO'Q. Q2/Q3 ga daxli emas.
   * Admin keyin shu maydonga yozadi; hozir seed/JSON.
   */
  franchiseField: 'franchiseMovieIds',

  /** QATLAM 2 — title overlap past chegarasi (0..1). */
  minNameOverlap: 0.3,

  /** Cache qatorlaridagi layer belgilari (tartib qat'iy). */
  layers: Object.freeze({
    franchise: 'franchise',
    nameGenre: 'name_genre',
    general: 'general',
  }),

  /**
   * QATLAM 3 — computeGeneralSimilarity vaznlari.
   * w1 genre, w2 actor, w3 director, w4 country, w5 year.
   */
  general: Object.freeze({
    w1Genre: 0.35,
    w2Actor: 0.25,
    w3Director: 0.15,
    w4Country: 0.1,
    w5Year: 0.15,
  }),

  /** To'liq katalog precompute oralig'i (ms). */
  precomputeIntervalMs: 12 * 60 * 60 * 1000,
};

module.exports = {
  similarityWeights,
};
