/**
 * Affinity updates from listen / like events (music dimensions).
 *
 * @module recommendation-music/services/affinity.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { dimensions, extractAllDimensionValues } = require('../dimensions');
const {
  applyDecay,
  computeListenBoost,
  capListenBoost,
  reinforceAffinity,
} = require('../utils/decay');
const {
  findAffinityCells,
  bulkUpsertAffinities,
  getAffinityMapWithMeta,
} = require('../repositories/userAffinity.repository');
const { countPriorListens } = require('../repositories/listenEvent.repository');
const { toContentKey } = require('../utils/contentKey');

const resolveBoost = (listenEvent, priorListenCount, weights = scoringWeights) => {
  let boost = computeListenBoost(listenEvent, weights.decay);

  if (priorListenCount > 0) {
    boost *= Math.min(1, weights.duplicateListenCap / (priorListenCount + 1));
  }

  return capListenBoost(boost, weights);
};

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
  const nowDate = new Date(nowMs);

  const valuesByType =
    dimensionSnapshot && typeof dimensionSnapshot === 'object'
      ? dimensionSnapshot
      : content
        ? extractAllDimensionValues(content, dims)
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
    return { updatedCells: 0, boost: 0, priorListenCount: 0, valuesByType };
  }

  const priorListenCount = await countPriorListens(userId, contentKey, listenEventId);
  const boost = resolveBoost({ completionRate, liked }, priorListenCount, weights);

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
  const nowDate = new Date(nowMs);

  const valuesByType =
    dimensionSnapshot && typeof dimensionSnapshot === 'object'
      ? dimensionSnapshot
      : content
        ? extractAllDimensionValues(content, dims)
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

  const boost = capListenBoost(weights.decay.likedBoost, weights);
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

  const penalty = capListenBoost(weights.decay.likedBoost, weights);
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
};
