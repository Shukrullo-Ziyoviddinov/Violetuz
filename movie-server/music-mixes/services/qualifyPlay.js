/**
 * Mix martasi. 80% — faqat shu yerda.
 * recommendation-music tinglandi eshigi chaqirilmaydi.
 *
 * @module music-mixes/services/qualifyPlay
 */

'use strict';

const { musicMixWeights } = require('../config/musicMixWeights');

/**
 * Eshitilgan vaqt qo‘shiq davomiyligining 80% idan kam bo‘lmasa, bitta marta.
 *
 * @param {number} listenedSeconds
 * @param {number|null|undefined} durationSec
 * @returns {boolean}
 */
const isQualifiedMixPlay = (listenedSeconds, durationSec) => {
  const listened = Number(listenedSeconds);
  const duration = Number(durationSec);
  const ratio = Number(musicMixWeights.minListenRatio);
  if (!Number.isFinite(listened) || listened < 0) return false;
  if (!Number.isFinite(duration) || duration <= 0) return false;
  if (!Number.isFinite(ratio) || ratio <= 0) return false;
  return listened / duration >= ratio;
};

module.exports = {
  isQualifiedMixPlay,
};
