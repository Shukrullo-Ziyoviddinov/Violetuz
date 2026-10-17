/**
 * Parda ortida video foizi. 0..1.
 * Kino daqiqasi va aktyor baliga aloqasi yo‘q.
 *
 * @module recommendation-triller/utils/completion
 */

'use strict';

const clamp01 = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(1, Math.max(0, num));
};

/**
 * Berilgan foiz va video sekundlaridan eng yuqori 0..1 qiymat.
 * durationSec shu videoning uzunligi, kinoniki emas.
 *
 * @param {Object} [input]
 * @param {number} [input.completionRate]
 * @param {number} [input.watchedSeconds]
 * @param {number} [input.durationSec]
 * @returns {number}
 */
const resolveCompletionRate = (input = {}) => {
  let rate = clamp01(input.completionRate);
  const watchedSeconds = Number(input.watchedSeconds);
  const durationSec = Number(input.durationSec);

  if (
    Number.isFinite(watchedSeconds) &&
    watchedSeconds >= 0 &&
    Number.isFinite(durationSec) &&
    durationSec > 0
  ) {
    rate = Math.max(rate, clamp01(watchedSeconds / durationSec));
  }

  return rate;
};

module.exports = {
  clamp01,
  resolveCompletionRate,
};
