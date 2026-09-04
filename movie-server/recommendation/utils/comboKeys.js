/**
 * Combo dimension key helpers (genre×country, genre×actor, …).
 *
 * @module recommendation/utils/comboKeys
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { normalizeDimensionValue, toStringList } = require('./values');

/**
 * @param {string} left
 * @param {string} right
 * @param {string} [separator]
 * @returns {string}
 */
const makeComboKey = (left, right, separator = scoringWeights.comboSeparator) => {
  const a = normalizeDimensionValue(left);
  const b = normalizeDimensionValue(right);
  if (!a || !b) return '';
  return `${a}${separator}${b}`;
};

/**
 * Cartesian product of two value lists → combo keys.
 * Empty side → [] (dimensionScore will be 0).
 *
 * @param {unknown} leftRaw
 * @param {unknown} rightRaw
 * @param {string} [separator]
 * @returns {string[]}
 */
const cartesianComboKeys = (leftRaw, rightRaw, separator = scoringWeights.comboSeparator) => {
  const left = toStringList(leftRaw);
  const right = toStringList(rightRaw);
  if (!left.length || !right.length) return [];

  const seen = new Set();
  /** @type {string[]} */
  const out = [];

  for (const a of left) {
    for (const b of right) {
      const key = makeComboKey(a, b, separator);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
  }

  return out;
};

module.exports = {
  makeComboKey,
  cartesianComboKeys,
};
