/**
 * Factory for AffinityDimension objects — scoring engine loops this list.
 *
 * @module recommendation/dimensions/createDimension
 */

'use strict';

/**
 * @param {Object} spec
 * @param {import('../types/recommendation.types').DimensionType} spec.type
 * @param {string} spec.weightKey
 * @param {(movie: import('../types/recommendation.types').Movie) => string[]} spec.extractValues
 * @param {boolean} [spec.isCombo]
 * @returns {import('../types/recommendation.types').AffinityDimension}
 */
const createDimension = ({ type, weightKey, extractValues, isCombo = false }) => {
  if (!type || typeof type !== 'string') {
    throw new Error('AffinityDimension.type is required');
  }
  if (!weightKey || typeof weightKey !== 'string') {
    throw new Error(`AffinityDimension "${type}" requires weightKey`);
  }
  if (typeof extractValues !== 'function') {
    throw new Error(`AffinityDimension "${type}" requires extractValues(movie)`);
  }

  return Object.freeze({
    type,
    weightKey,
    isCombo: Boolean(isCombo),
    extractValues: (movie) => {
      if (!movie || typeof movie !== 'object') return [];
      try {
        const values = extractValues(movie);
        return Array.isArray(values) ? values : [];
      } catch {
        return [];
      }
    },
  });
};

module.exports = {
  createDimension,
};
