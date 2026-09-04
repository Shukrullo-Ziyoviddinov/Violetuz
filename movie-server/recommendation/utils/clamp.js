/**
 * Numeric clamp — keeps decay / scores out of infinity / negatives.
 *
 * @module recommendation/utils/clamp
 */

'use strict';

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const clamp = (value, min, max) => {
  const n = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  const lo = typeof min === 'number' && !Number.isNaN(min) ? min : 0;
  const hi = typeof max === 'number' && !Number.isNaN(max) ? max : 0;
  if (lo > hi) return lo;
  return Math.min(hi, Math.max(lo, n));
};

/**
 * Map value from [inMin, inMax] into [0, 1].
 * @param {number} value
 * @param {number} [inMin=0]
 * @param {number} [inMax=1]
 * @returns {number}
 */
const normalize01 = (value, inMin = 0, inMax = 1) => {
  if (inMax === inMin) return 0;
  return clamp((value - inMin) / (inMax - inMin), 0, 1);
};

module.exports = {
  clamp,
  normalize01,
};
