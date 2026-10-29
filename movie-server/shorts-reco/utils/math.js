'use strict';

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

module.exports = {
  clamp,
};
