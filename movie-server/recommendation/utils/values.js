/**
 * Normalize raw movie field values into clean string tokens for affinity keys.
 * Empty / null inputs → [] (never throw).
 *
 * @module recommendation/utils/values
 */

'use strict';

/**
 * @param {unknown} value
 * @returns {string}
 */
const normalizeDimensionValue = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

/**
 * Coerce a movie field (string | string[] | number | number[] | mixed) to unique non-empty strings.
 * @param {unknown} raw
 * @returns {string[]}
 */
const toStringList = (raw) => {
  if (raw === null || raw === undefined || raw === '') return [];

  const list = Array.isArray(raw) ? raw : [raw];
  const seen = new Set();
  /** @type {string[]} */
  const out = [];

  for (const item of list) {
    const normalized = normalizeDimensionValue(item);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }

  return out;
};

/**
 * Average of affinity scores for the values a movie carries on one dimension.
 * Sum is intentionally NOT used (multi-value movies must not inflate).
 * Missing / empty → 0.
 *
 * @param {string[]} values
 * @param {Object.<string, number>} [affinityByValue]
 * @returns {number}
 */
const averageAffinity = (values, affinityByValue = {}) => {
  if (!values.length) return 0;

  let sum = 0;
  for (const value of values) {
    const score = affinityByValue[value];
    sum += typeof score === 'number' && !Number.isNaN(score) ? score : 0;
  }

  return sum / values.length;
};

module.exports = {
  normalizeDimensionValue,
  toStringList,
  averageAffinity,
};
