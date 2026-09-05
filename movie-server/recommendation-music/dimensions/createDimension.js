/**
 * Factory for AffinityDimension objects — music scoring loops this list.
 *
 * @module recommendation-music/dimensions/createDimension
 */

'use strict';

/**
 * @param {Object} spec
 * @param {string} spec.type
 * @param {string} spec.weightKey
 * @param {(content: import('../types/musicRecommendation.types').MusicContent) => string[]} spec.extractValues
 * @param {boolean} [spec.isCombo]
 * @returns {import('../types/musicRecommendation.types').AffinityDimension}
 */
const createDimension = ({ type, weightKey, extractValues, isCombo = false }) => {
  if (!type || typeof type !== 'string') {
    throw new Error('AffinityDimension.type is required');
  }
  if (!weightKey || typeof weightKey !== 'string') {
    throw new Error(`AffinityDimension "${type}" requires weightKey`);
  }
  if (typeof extractValues !== 'function') {
    throw new Error(`AffinityDimension "${type}" requires extractValues(content)`);
  }

  return Object.freeze({
    type,
    weightKey,
    isCombo: Boolean(isCombo),
    extractValues: (content) => {
      if (!content || typeof content !== 'object') return [];
      try {
        const values = extractValues(content);
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
