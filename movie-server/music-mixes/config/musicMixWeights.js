/**
 * "Sizning mixlaringiz" sozlamasi.
 *
 * Alohida modul. Kino home-feed, music-home-feed va
 * recommendation-music/config/scoringWeights.js ga yozilmaydi.
 *
 * 80% faqat mix martasini sanash uchun. "Tinglandi" eshigi
 * (10 soniya yoki qisqa trekda 80 foiz) bu yerda yo'q va o'zgartirilmaydi.
 *
 * @module music-mixes/config/musicMixWeights
 */

'use strict';

/**
 * Barcha sonlar shu yerda. Keyingi qadamlar shu configdan o'qiydi.
 */
const musicMixWeights = {
  /** Faqat qo'shiq. Albom, klip, konsert mixga kirmaydi. */
  contentType: 'music',

  /**
   * Mix uchun bir marta. Eshitilgan vaqt / davomiylik shu sondan kam bo'lmasa.
   * Tinglandi formulasidan alohida.
   */
  minListenRatio: 0.8,

  /** Mixga kirish uchun shu qo'shiq necha marta 80% eshitilgan bo'lishi kerak. */
  minPlays: 3,

  /** Bir janr mixidagi qo'shiqlar chegarasi. */
  mixSize: 25,

  /** Janri bo'sh qo'shiq shu nomdagi mixga tushadi. */
  unknownGenre: 'Boshqa',

  /** Tayyor mixni qayta yig'ish oralig'i (ms). */
  precomputeIntervalMs: 6 * 60 * 60 * 1000,
};

module.exports = {
  musicMixWeights,
};
