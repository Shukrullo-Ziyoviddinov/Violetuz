/**
 * Affinity updates from watch events — generic over AffinityDimension registry.
 *
 * @module recommendation/services/affinity.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { dimensions, extractAllDimensionValues } = require('../dimensions');
const {
  applyDecay,
  computeWatchBoost,
  capWatchBoost,
  reinforceAffinity,
} = require('../utils/decay');
const {
  findAffinityCells,
  bulkUpsertAffinities,
  getAffinityMapWithMeta,
} = require('../repositories/userAffinity.repository');
const { countPriorWatches } = require('../repositories/watchEvent.repository');

/**
 * Effective boost after duplicate-watch dampening.
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
 * Apply one watch to all registered dimensions (additive, not filtering).
 *
 * @param {Object} params
 * @param {string|import('mongoose').Types.ObjectId} params.userId
 * @param {string} params.category
 * @param {string|number} params.movieId
 * @param {number} [params.completionRate]
 * @param {boolean} [params.liked]
 * @param {Object} [params.movie] — projection; used if snapshot missing
 * @param {Object.<string, string[]>} [params.dimensionSnapshot]
 * @param {string|import('mongoose').Types.ObjectId} [params.watchEventId]
 * @param {Date|number} [params.now]
 * @param {import('../types/recommendation.types').AffinityDimension[]} [params.dims]
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [params.weights]
 * @returns {Promise<{ updatedCells: number, boost: number, priorWatchCount: number, valuesByType: Object.<string, string[]> }>}
 */
const applyWatchToAffinities = async (params) => {
  const {
    userId,
    category,
    movieId,
    completionRate = 0,
    liked = false,
    movie = null,
    dimensionSnapshot = null,
    watchEventId = null,
    now = Date.now(),
    dims = dimensions,
    weights = scoringWeights,
  } = params;

  const categoryName = String(category || movie?.categoryName || '').trim();
  if (!userId || !categoryName) {
    return { updatedCells: 0, boost: 0, priorWatchCount: 0, valuesByType: {} };
  }

  const nowMs = now instanceof Date ? now.getTime() : now;
  const nowDate = new Date(nowMs);

  const valuesByType =
    dimensionSnapshot && typeof dimensionSnapshot === 'object'
      ? dimensionSnapshot
      : movie
        ? extractAllDimensionValues(movie, dims)
        : {};

  /** @type {Array<{ dimensionType: string, dimensionValue: string }>} */
  const keys = [];
  for (const dim of dims) {
    const values = Array.isArray(valuesByType[dim.type]) ? valuesByType[dim.type] : [];
    for (const value of values) {
      if (!value) continue;
      keys.push({ dimensionType: dim.type, dimensionValue: String(value) });
    }
  }

  if (!keys.length) {
    return { updatedCells: 0, boost: 0, priorWatchCount: 0, valuesByType };
  }

  const priorWatchCount = await countPriorWatches(userId, movieId, watchEventId);
  const boost = resolveBoost({ completionRate, liked }, priorWatchCount, weights);

  const existing = await findAffinityCells(userId, categoryName, keys);

  /** @type {Array<Object>} */
  const cells = [];

  for (const key of keys) {
    const mapKey = `${key.dimensionType}\0${key.dimensionValue}`;
    const prev = existing.get(mapKey);
    const decayed = prev
      ? applyDecay(prev.affinityScore, prev.updatedAt, weights.decay, nowMs)
      : 0;
    const nextScore = reinforceAffinity(decayed, boost, weights.decay, weights);

    cells.push({
      userId,
      category: categoryName,
      dimensionType: key.dimensionType,
      dimensionValue: key.dimensionValue,
      affinityScore: nextScore,
      updatedAt: nowDate,
    });
  }

  const writeResult = await bulkUpsertAffinities(cells);

  return {
    updatedCells: cells.length,
    upserted: writeResult.upserted,
    modified: writeResult.modified,
    boost,
    priorWatchCount,
    valuesByType,
  };
};

/**
 * Like signal only — affinity boost without WatchEvent / ContentView ("ko'rildi").
 *
 * @param {Object} params
 * @param {string|import('mongoose').Types.ObjectId} params.userId
 * @param {string} params.category
 * @param {string|number} params.movieId
 * @param {Object} [params.movie]
 * @param {Object.<string, string[]>} [params.dimensionSnapshot]
 * @param {Date|number} [params.now]
 * @param {import('../types/recommendation.types').AffinityDimension[]} [params.dims]
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [params.weights]
 * @returns {Promise<{ updatedCells: number, boost: number, valuesByType: Object.<string, string[]> }>}
 */
const applyLikeToAffinities = async (params) => {
  const {
    userId,
    category,
    movieId,
    movie = null,
    dimensionSnapshot = null,
    now = Date.now(),
    dims = dimensions,
    weights = scoringWeights,
  } = params;

  const categoryName = String(category || movie?.categoryName || '').trim();
  if (!userId || !categoryName) {
    return { updatedCells: 0, boost: 0, valuesByType: {} };
  }

  const nowMs = now instanceof Date ? now.getTime() : now;
  const nowDate = new Date(nowMs);

  const valuesByType =
    dimensionSnapshot && typeof dimensionSnapshot === 'object'
      ? dimensionSnapshot
      : movie
        ? extractAllDimensionValues(movie, dims)
        : {};

  /** @type {Array<{ dimensionType: string, dimensionValue: string }>} */
  const keys = [];
  for (const dim of dims) {
    const values = Array.isArray(valuesByType[dim.type]) ? valuesByType[dim.type] : [];
    for (const value of values) {
      if (!value) continue;
      keys.push({ dimensionType: dim.type, dimensionValue: String(value) });
    }
  }

  if (!keys.length) {
    return { updatedCells: 0, boost: 0, valuesByType };
  }

  // Like ≠ watch: only likedBoost (no watchBoost / completion).
  const boost = capWatchBoost(weights.decay.likedBoost, weights);

  const existing = await findAffinityCells(userId, categoryName, keys);

  /** @type {Array<Object>} */
  const cells = [];

  for (const key of keys) {
    const mapKey = `${key.dimensionType}\0${key.dimensionValue}`;
    const prev = existing.get(mapKey);
    const decayed = prev
      ? applyDecay(prev.affinityScore, prev.updatedAt, weights.decay, nowMs)
      : 0;
    const nextScore = reinforceAffinity(decayed, boost, weights.decay, weights);

    cells.push({
      userId,
      category: categoryName,
      dimensionType: key.dimensionType,
      dimensionValue: key.dimensionValue,
      affinityScore: nextScore,
      updatedAt: nowDate,
    });
  }

  const writeResult = await bulkUpsertAffinities(cells);

  return {
    updatedCells: cells.length,
    upserted: writeResult.upserted,
    modified: writeResult.modified,
    boost,
    movieId: String(movieId),
    valuesByType,
  };
};

/**
 * Reverse a prior like boost (unlike / dislike) — still no ContentView / WatchEvent.
 *
 * @param {Object} params — same shape as applyLikeToAffinities
 */
const applyUnlikeToAffinities = async (params) => {
  const {
    userId,
    category,
    movieId,
    movie = null,
    dimensionSnapshot = null,
    now = Date.now(),
    dims = dimensions,
    weights = scoringWeights,
  } = params;

  const categoryName = String(category || movie?.categoryName || '').trim();
  if (!userId || !categoryName) {
    return { updatedCells: 0, boost: 0, valuesByType: {} };
  }

  const nowMs = now instanceof Date ? now.getTime() : now;
  const nowDate = new Date(nowMs);

  const valuesByType =
    dimensionSnapshot && typeof dimensionSnapshot === 'object'
      ? dimensionSnapshot
      : movie
        ? extractAllDimensionValues(movie, dims)
        : {};

  /** @type {Array<{ dimensionType: string, dimensionValue: string }>} */
  const keys = [];
  for (const dim of dims) {
    const values = Array.isArray(valuesByType[dim.type]) ? valuesByType[dim.type] : [];
    for (const value of values) {
      if (!value) continue;
      keys.push({ dimensionType: dim.type, dimensionValue: String(value) });
    }
  }

  if (!keys.length) {
    return { updatedCells: 0, boost: 0, valuesByType };
  }

  const penalty = capWatchBoost(weights.decay.likedBoost, weights);
  const existing = await findAffinityCells(userId, categoryName, keys);

  /** @type {Array<Object>} */
  const cells = [];

  for (const key of keys) {
    const mapKey = `${key.dimensionType}\0${key.dimensionValue}`;
    const prev = existing.get(mapKey);
    if (!prev) continue;

    const decayed = applyDecay(prev.affinityScore, prev.updatedAt, weights.decay, nowMs);
    const nextScore = Math.max(
      weights.decay.minScore,
      Math.min(weights.decay.maxScore, decayed - penalty)
    );

    cells.push({
      userId,
      category: categoryName,
      dimensionType: key.dimensionType,
      dimensionValue: key.dimensionValue,
      affinityScore: nextScore,
      updatedAt: nowDate,
    });
  }

  if (!cells.length) {
    return { updatedCells: 0, boost: -penalty, valuesByType };
  }

  const writeResult = await bulkUpsertAffinities(cells);

  return {
    updatedCells: cells.length,
    upserted: writeResult.upserted,
    modified: writeResult.modified,
    boost: -penalty,
    movieId: String(movieId),
    valuesByType,
  };
};

/**
 * Convenience: load affinity map (with meta) for scoring.
 */
const loadAffinityMap = getAffinityMapWithMeta;

module.exports = {
  resolveBoost,
  applyWatchToAffinities,
  applyLikeToAffinities,
  applyUnlikeToAffinities,
  loadAffinityMap,
};
