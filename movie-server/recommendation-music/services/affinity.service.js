/**
 * Affinity updates from listen / like events (music dimensions).
 *
 * Persistence + I/O live here. Pure math lives in utils/affinityCalculator.js
 * so guestAffinityBuilder can reuse the same formula without DB writes.
 *
 * @module recommendation-music/services/affinity.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { dimensions, extractAllDimensionValues } = require('../dimensions');
const { applyDecay, capListenBoost } = require('../utils/decay');
const {
  resolveBoost,
  collectDimensionKeys,
  cellMapKey,
  computeReinforcedCells,
  computeListenAffinityDelta,
} = require('../utils/affinityCalculator');
const {
  findAffinityCells,
  bulkUpsertAffinities,
  getAffinityMapWithMeta,
} = require('../repositories/userAffinity.repository');
const { countPriorListens } = require('../repositories/listenEvent.repository');
const { toContentKey } = require('../utils/contentKey');

/**
 * Apply one listen to all registered dimensions.
 */
const applyListenToAffinities = async (params) => {
  const {
    userId,
    category,
    contentType,
    contentId,
    contentKey: contentKeyInput,
    completionRate = 0,
    liked = false,
    content = null,
    dimensionSnapshot = null,
    listenEventId = null,
    now = Date.now(),
    dims = dimensions,
    weights = scoringWeights,
  } = params;

  const categoryName = String(category || content?.categoryNameMusic || '').trim();
  const contentKey =
    contentKeyInput ||
    toContentKey(contentType || content?.contentType, contentId ?? content?.id);

  if (!userId || !categoryName || !contentKey) {
    return { updatedCells: 0, boost: 0, priorListenCount: 0, valuesByType: {} };
  }

  const nowMs = now instanceof Date ? now.getTime() : now;

  const valuesByType =
    dimensionSnapshot && typeof dimensionSnapshot === 'object'
      ? dimensionSnapshot
      : content
        ? extractAllDimensionValues(content, dims)
        : {};

  const keys = collectDimensionKeys(valuesByType, dims);
  if (!keys.length) {
    return { updatedCells: 0, boost: 0, priorListenCount: 0, valuesByType };
  }

  const priorListenCount = await countPriorListens(userId, contentKey, listenEventId);
  const existing = await findAffinityCells(userId, categoryName, keys);

  const { cells: scoredCells, boost } = computeListenAffinityDelta({
    valuesByType,
    existing,
    completionRate,
    liked,
    priorListenCount,
    nowMs,
    dims,
    weights,
  });

  /** @type {Array<Object>} */
  const cells = scoredCells.map((cell) => ({
    userId,
    category: categoryName,
    dimensionType: cell.dimensionType,
    dimensionValue: cell.dimensionValue,
    affinityScore: cell.affinityScore,
    updatedAt: cell.updatedAt,
  }));

  const writeResult = await bulkUpsertAffinities(cells);

  return {
    updatedCells: cells.length,
    upserted: writeResult.upserted,
    modified: writeResult.modified,
    boost,
    priorListenCount,
    valuesByType,
  };
};

/**
 * Like signal only — clip/concert. No ContentView / ListenEvent.
 */
const applyLikeToAffinities = async (params) => {
  const {
    userId,
    category,
    contentType,
    contentId,
    content = null,
    dimensionSnapshot = null,
    now = Date.now(),
    dims = dimensions,
    weights = scoringWeights,
  } = params;

  const type = String(contentType || content?.contentType || '').trim();
  if (!weights.likeEnabledTypes.includes(type)) {
    return { updatedCells: 0, boost: 0, valuesByType: {}, skipped: true, reason: 'like_disabled' };
  }

  const categoryName = String(category || content?.categoryNameMusic || '').trim();
  if (!userId || !categoryName) {
    return { updatedCells: 0, boost: 0, valuesByType: {} };
  }

  const nowMs = now instanceof Date ? now.getTime() : now;

  const valuesByType =
    dimensionSnapshot && typeof dimensionSnapshot === 'object'
      ? dimensionSnapshot
      : content
        ? extractAllDimensionValues(content, dims)
        : {};

  const keys = collectDimensionKeys(valuesByType, dims);
  if (!keys.length) {
    return { updatedCells: 0, boost: 0, valuesByType };
  }

  const boost = capListenBoost(weights.decay.likedBoost, weights);
  const existing = await findAffinityCells(userId, categoryName, keys);

  const scoredCells = computeReinforcedCells({
    keys,
    existing,
    boost,
    nowMs,
    weights,
  });

  /** @type {Array<Object>} */
  const cells = scoredCells.map((cell) => ({
    userId,
    category: categoryName,
    dimensionType: cell.dimensionType,
    dimensionValue: cell.dimensionValue,
    affinityScore: cell.affinityScore,
    updatedAt: cell.updatedAt,
  }));

  const writeResult = await bulkUpsertAffinities(cells);

  return {
    updatedCells: cells.length,
    upserted: writeResult.upserted,
    modified: writeResult.modified,
    boost,
    contentId: String(contentId),
    valuesByType,
  };
};

const applyUnlikeToAffinities = async (params) => {
  const {
    userId,
    category,
    contentType,
    contentId,
    content = null,
    dimensionSnapshot = null,
    now = Date.now(),
    dims = dimensions,
    weights = scoringWeights,
  } = params;

  const type = String(contentType || content?.contentType || '').trim();
  if (!weights.likeEnabledTypes.includes(type)) {
    return { updatedCells: 0, boost: 0, valuesByType: {}, skipped: true, reason: 'like_disabled' };
  }

  const categoryName = String(category || content?.categoryNameMusic || '').trim();
  if (!userId || !categoryName) {
    return { updatedCells: 0, boost: 0, valuesByType: {} };
  }

  const nowMs = now instanceof Date ? now.getTime() : now;
  const nowDate = new Date(nowMs);

  const valuesByType =
    dimensionSnapshot && typeof dimensionSnapshot === 'object'
      ? dimensionSnapshot
      : content
        ? extractAllDimensionValues(content, dims)
        : {};

  const keys = collectDimensionKeys(valuesByType, dims);
  if (!keys.length) {
    return { updatedCells: 0, boost: 0, valuesByType };
  }

  const penalty = capListenBoost(weights.decay.likedBoost, weights);
  const existing = await findAffinityCells(userId, categoryName, keys);

  /** @type {Array<Object>} */
  const cells = [];

  for (const key of keys) {
    const mapKey = cellMapKey(key.dimensionType, key.dimensionValue);
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
    contentId: String(contentId),
    valuesByType,
  };
};

const loadAffinityMap = getAffinityMapWithMeta;

module.exports = {
  resolveBoost,
  applyListenToAffinities,
  applyLikeToAffinities,
  applyUnlikeToAffinities,
  loadAffinityMap,
  computeListenAffinityDelta,
  computeAffinityDelta: computeListenAffinityDelta,
  collectDimensionKeys,
  computeReinforcedCells,
  cellMapKey,
};
