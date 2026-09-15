/**
 * Pure affinity calculation kernel (no DB I/O).
 *
 * Login path: affinity.service.applyWatchToAffinities → here → bulkUpsert
 * Guest path (next): guestAffinityBuilder → here → in-memory map only
 *
 * Formula must stay identical for both; only persistence differs.
 *
 * @module recommendation/utils/affinityCalculator
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { dimensions } = require('../dimensions');
const {
  applyDecay,
  computeWatchBoost,
  capWatchBoost,
  reinforceAffinity,
} = require('./decay');

/**
 * Effective boost after duplicate-watch dampening.
 * (Same formula previously in affinity.service.resolveBoost.)
 *
 * @param {Object} watchEvent
 * @param {number} priorWatchCount
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [weights]
 * @returns {number}
 */
const resolveBoost = (watchEvent, priorWatchCount, weights = scoringWeights) => {
  let boost = computeWatchBoost(watchEvent, weights.decay);

  if (priorWatchCount > 0) {
    // Rewatch: shrink boost so repeated events cannot explode affinity
    boost *= Math.min(1, weights.duplicateWatchCap / (priorWatchCount + 1));
  }

  return capWatchBoost(boost, weights);
};

/**
 * Flatten dimension snapshot → cell keys.
 *
 * @param {Object.<string, string[]>} valuesByType
 * @param {import('../types/recommendation.types').AffinityDimension[]} [dims]
 * @returns {Array<{ dimensionType: string, dimensionValue: string }>}
 */
const collectDimensionKeys = (valuesByType = {}, dims = dimensions) => {
  /** @type {Array<{ dimensionType: string, dimensionValue: string }>} */
  const keys = [];
  for (const dim of dims) {
    const values = Array.isArray(valuesByType[dim.type])
      ? valuesByType[dim.type]
      : [];
    for (const value of values) {
      if (!value) continue;
      keys.push({ dimensionType: dim.type, dimensionValue: String(value) });
    }
  }
  return keys;
};

const cellMapKey = (dimensionType, dimensionValue) =>
  `${dimensionType}\0${dimensionValue}`;

/**
 * Pure: applyDecay(existing) + reinforceAffinity(boost) per key.
 *
 * @param {Object} params
 * @param {Array<{ dimensionType: string, dimensionValue: string }>} params.keys
 * @param {Map<string, { affinityScore?: number, score?: number, updatedAt?: Date|number|string }>} [params.existing]
 * @param {number} params.boost
 * @param {number} [params.nowMs]
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [params.weights]
 * @returns {Array<{ dimensionType: string, dimensionValue: string, affinityScore: number, updatedAt: Date }>}
 */
const computeReinforcedCells = ({
  keys,
  existing = new Map(),
  boost,
  nowMs = Date.now(),
  weights = scoringWeights,
}) => {
  const nowDate = new Date(nowMs);
  /** @type {Array<{ dimensionType: string, dimensionValue: string, affinityScore: number, updatedAt: Date }>} */
  const cells = [];

  for (const key of keys) {
    const mapKey = cellMapKey(key.dimensionType, key.dimensionValue);
    const prev = existing.get(mapKey);
    const prevScore =
      prev == null
        ? 0
        : typeof prev.affinityScore === 'number'
          ? prev.affinityScore
          : typeof prev.score === 'number'
            ? prev.score
            : 0;
    const decayed = prev
      ? applyDecay(prevScore, prev.updatedAt, weights.decay, nowMs)
      : 0;
    const nextScore = reinforceAffinity(decayed, boost, weights.decay, weights);

    cells.push({
      dimensionType: key.dimensionType,
      dimensionValue: key.dimensionValue,
      affinityScore: nextScore,
      updatedAt: nowDate,
    });
  }

  return cells;
};

/**
 * Pure watch → affinity cell updates (DB-agnostic).
 *
 * @param {Object} params
 * @param {Object.<string, string[]>} params.valuesByType
 * @param {Map<string, { affinityScore?: number, score?: number, updatedAt?: * }>} [params.existing]
 * @param {number} [params.completionRate]
 * @param {boolean} [params.liked]
 * @param {number} [params.priorWatchCount]
 * @param {number} [params.nowMs]
 * @param {import('../types/recommendation.types').AffinityDimension[]} [params.dims]
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [params.weights]
 * @returns {{ cells: Array, boost: number, keys: Array, valuesByType: Object }}
 */
const computeWatchAffinityDelta = ({
  valuesByType = {},
  existing = new Map(),
  completionRate = 0,
  liked = false,
  priorWatchCount = 0,
  nowMs = Date.now(),
  dims = dimensions,
  weights = scoringWeights,
} = {}) => {
  const keys = collectDimensionKeys(valuesByType, dims);
  if (!keys.length) {
    return { cells: [], boost: 0, keys, valuesByType };
  }

  const boost = resolveBoost({ completionRate, liked }, priorWatchCount, weights);
  const cells = computeReinforcedCells({
    keys,
    existing,
    boost,
    nowMs,
    weights,
  });

  return { cells, boost, keys, valuesByType };
};

/**
 * Alias for prompt / guest builder naming.
 * Same as computeWatchAffinityDelta — one formula, two callers.
 */
const computeAffinityDelta = computeWatchAffinityDelta;

module.exports = {
  resolveBoost,
  collectDimensionKeys,
  cellMapKey,
  computeReinforcedCells,
  computeWatchAffinityDelta,
  computeAffinityDelta,
};
