/**
 * AffinityDimension registry — generic loop target for scoring & affinity updates.
 *
 * Usage:
 *   for (const dim of dimensions) {
 *     const values = dim.extractValues(movie);
 *     const weight = getDimensionWeight(dim);
 *     ...
 *   }
 *
 * To add "director" later: createDimension({...}) and push via registerDimension.
 *
 * @module recommendation/dimensions
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { createDimension } = require('./createDimension');
const { builtinDimensions } = require('./builtin');
const { averageAffinity } = require('../utils/values');

/** @type {import('../types/recommendation.types').AffinityDimension[]} */
const dimensions = [...builtinDimensions];

/**
 * Register an extra dimension at runtime (e.g. director, language).
 * @param {import('../types/recommendation.types').AffinityDimension} dimension
 */
const registerDimension = (dimension) => {
  if (!dimension || typeof dimension.extractValues !== 'function') {
    throw new Error('registerDimension expects AffinityDimension');
  }
  const exists = dimensions.some((d) => d.type === dimension.type);
  if (exists) {
    throw new Error(`Dimension already registered: ${dimension.type}`);
  }
  dimensions.push(dimension);
};

/**
 * @param {import('../types/recommendation.types').DimensionType} type
 * @returns {import('../types/recommendation.types').AffinityDimension|undefined}
 */
const getDimensionByType = (type) => dimensions.find((d) => d.type === type);

/**
 * Resolve numeric weight from config via dimension.weightKey (generic — no switches).
 * @param {import('../types/recommendation.types').AffinityDimension} dimension
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [weights]
 * @returns {number}
 */
const getDimensionWeight = (dimension, weights = scoringWeights) => {
  const raw = weights[dimension.weightKey];
  return typeof raw === 'number' && !Number.isNaN(raw) ? raw : 0;
};

/**
 * Extract all dimension → values for a movie in one generic pass.
 * @param {import('../types/recommendation.types').Movie} movie
 * @param {import('../types/recommendation.types').AffinityDimension[]} [dims]
 * @returns {Object.<string, string[]>}
 */
const extractAllDimensionValues = (movie, dims = dimensions) => {
  /** @type {Object.<string, string[]>} */
  const out = {};
  for (const dim of dims) {
    out[dim.type] = dim.extractValues(movie);
  }
  return out;
};

/**
 * Additive (non-filtering) dimension score for one movie × one dimension.
 * Average of matching user affinities — never sum.
 *
 * @param {import('../types/recommendation.types').AffinityDimension} dimension
 * @param {import('../types/recommendation.types').Movie} movie
 * @param {import('../types/recommendation.types').AffinityMap} [affinityMap]
 * @returns {number}
 */
const scoreDimension = (dimension, movie, affinityMap = {}) => {
  const values = dimension.extractValues(movie);
  const byValue = affinityMap[dimension.type] || {};
  return averageAffinity(values, byValue);
};

/**
 * Weighted sum across all registered dimensions (additive personalization).
 * Does NOT apply popularity / recency / watchedPenalty — those land in scoring service.
 *
 * @param {import('../types/recommendation.types').Movie} movie
 * @param {import('../types/recommendation.types').AffinityMap} [affinityMap]
 * @param {import('../types/recommendation.types').AffinityDimension[]} [dims]
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [weights]
 * @returns {{ total: number, byType: Object.<string, number> }}
 */
const scoreAllDimensions = (movie, affinityMap = {}, dims = dimensions, weights = scoringWeights) => {
  /** @type {Object.<string, number>} */
  const byType = {};
  let total = 0;

  for (const dim of dims) {
    const dimScore = scoreDimension(dim, movie, affinityMap);
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
