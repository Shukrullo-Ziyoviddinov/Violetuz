/**
 * Pure music affinity calculation kernel (no DB I/O).
 *
 * Login: affinity.service.applyListenToAffinities → here → bulkUpsert
 * Guest (next): guestAffinityBuilder → here → in-memory map only
 *
 * Formula identical for both; only persistence differs.
 *
 * @module recommendation-music/utils/affinityCalculator
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { dimensions } = require('../dimensions');
const {
  applyDecay,
  computeListenBoost,
  capListenBoost,
  reinforceAffinity,
} = require('./decay');

/**
 * Effective boost after duplicate-listen dampening.
 * (Same formula previously in affinity.service.resolveBoost.)
 *
 * @param {Object} listenEvent
 * @param {number} priorListenCount
 * @param {Object} [weights]
 * @returns {number}
 */
const resolveBoost = (listenEvent, priorListenCount, weights = scoringWeights) => {
  let boost = computeListenBoost(listenEvent, weights.decay);

  if (priorListenCount > 0) {
    boost *= Math.min(1, weights.duplicateListenCap / (priorListenCount + 1));
  }

  return capListenBoost(boost, weights);
};

/**
 * @param {Object.<string, string[]>} valuesByType
 * @param {Array} [dims]
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
 * Pure listen → affinity cell updates (DB-agnostic).
 *
 * @param {Object} params
 * @returns {{ cells: Array, boost: number, keys: Array, valuesByType: Object }}
 */
const computeListenAffinityDelta = ({
  valuesByType = {},
  existing = new Map(),
  completionRate = 0,
  liked = false,
  priorListenCount = 0,
  nowMs = Date.now(),
  dims = dimensions,
  weights = scoringWeights,
} = {}) => {
  const keys = collectDimensionKeys(valuesByType, dims);
  if (!keys.length) {
    return { cells: [], boost: 0, keys, valuesByType };
  }

  const boost = resolveBoost(
    { completionRate, liked },
    priorListenCount,
    weights
  );
  const cells = computeReinforcedCells({
    keys,
    existing,
    boost,
    nowMs,
    weights,
  });

  return { cells, boost, keys, valuesByType };
};

/** Alias for guest builder naming. */
const computeAffinityDelta = computeListenAffinityDelta;

module.exports = {
  resolveBoost,
  collectDimensionKeys,
  cellMapKey,
  computeReinforcedCells,
  computeListenAffinityDelta,
  computeAffinityDelta,
};
