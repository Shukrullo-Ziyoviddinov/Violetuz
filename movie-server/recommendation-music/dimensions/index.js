/**
 * AffinityDimension registry for music recommendation.
 *
 * @module recommendation-music/dimensions
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { createDimension } = require('./createDimension');
const { builtinDimensions } = require('./builtin');
const { averageAffinity } = require('../../recommendation/utils/values');

/** @type {import('../types/musicRecommendation.types').AffinityDimension[]} */
const dimensions = [...builtinDimensions];

/**
 * @param {import('../types/musicRecommendation.types').AffinityDimension} dimension
 */
const registerDimension = (dimension) => {
  if (!dimension || typeof dimension.extractValues !== 'function') {
    throw new Error('registerDimension expects AffinityDimension');
  }
  if (dimensions.some((d) => d.type === dimension.type)) {
    throw new Error(`Dimension already registered: ${dimension.type}`);
  }
  dimensions.push(dimension);
};

/**
 * @param {string} type
 */
const getDimensionByType = (type) => dimensions.find((d) => d.type === type);

/**
 * @param {import('../types/musicRecommendation.types').AffinityDimension} dimension
 * @param {Object} [weights]
 * @returns {number}
 */
const getDimensionWeight = (dimension, weights = scoringWeights) => {
  const raw = weights[dimension.weightKey];
  return typeof raw === 'number' && !Number.isNaN(raw) ? raw : 0;
};

/**
 * @param {import('../types/musicRecommendation.types').MusicContent} content
 * @param {import('../types/musicRecommendation.types').AffinityDimension[]} [dims]
 * @returns {Object.<string, string[]>}
 */
const extractAllDimensionValues = (content, dims = dimensions) => {
  /** @type {Object.<string, string[]>} */
  const out = {};
  for (const dim of dims) {
    out[dim.type] = dim.extractValues(content);
  }
  return out;
};

/**
 * @param {import('../types/musicRecommendation.types').AffinityDimension} dimension
 * @param {import('../types/musicRecommendation.types').MusicContent} content
 * @param {import('../types/musicRecommendation.types').AffinityMap} [affinityMap]
 * @returns {number}
 */
const scoreDimension = (dimension, content, affinityMap = {}) => {
  const values = dimension.extractValues(content);
  const byValue = affinityMap[dimension.type] || {};
  return averageAffinity(values, byValue);
};

/**
 * @param {import('../types/musicRecommendation.types').MusicContent} content
 * @param {import('../types/musicRecommendation.types').AffinityMap} [affinityMap]
 * @param {import('../types/musicRecommendation.types').AffinityDimension[]} [dims]
 * @param {Object} [weights]
 * @returns {{ total: number, byType: Object.<string, number> }}
 */
const scoreAllDimensions = (
  content,
  affinityMap = {},
  dims = dimensions,
  weights = scoringWeights
) => {
  /** @type {Object.<string, number>} */
  const byType = {};
  let total = 0;

  for (const dim of dims) {
    const dimScore = scoreDimension(dim, content, affinityMap);
    const weighted = getDimensionWeight(dim, weights) * dimScore;
    byType[dim.type] = dimScore;
    total += weighted;
  }

  return { total, byType };
};

module.exports = {
  dimensions,
  createDimension,
  registerDimension,
  getDimensionByType,
  getDimensionWeight,
  extractAllDimensionValues,
  scoreDimension,
  scoreAllDimensions,
};
