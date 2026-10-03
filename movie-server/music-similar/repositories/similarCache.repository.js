/**
 * music_similar_cache — yozish / o'qish.
 * Sahifa hisoblamaydi; fon job shu yerga yozadi, GET cache dan o'qiydi.
 *
 * @module music-similar/repositories/similarCache.repository
 */

'use strict';

const crypto = require('crypto');
const { MusicSimilarCache } = require('../models');
const { similarityWeights } = require('../config/similarityWeights');
const {
  toCatalogId,
  normalizeContentType,
  findCatalogItemsByIds,
} = require('./catalog.read');

const LAYER_SET = new Set(Object.values(similarityWeights.layers));

/**
 * @param {unknown} layer
 * @returns {string|null}
 */
const normalizeLayer = (layer) => {
  const key = String(layer || '').trim();
  return LAYER_SET.has(key) ? key : null;
};

/**
 * Bitta manba + type uchun cache ni almashtirish.
 *
 * @param {unknown} contentType
 * @param {string|number} sourceId
 * @param {Array<{ id?: number, similarId?: number, position?: number, layer?: string, score?: number }>} rows
 * @returns {Promise<{ written: number, batchId: string|null }>}
 */
const replaceSimilarForSource = async (contentType, sourceId, rows) => {
  const type = normalizeContentType(contentType);
  const srcId = toCatalogId(sourceId);
  if (!type || srcId == null) return { written: 0, batchId: null };

  /** @type {Array<{ similarId: number, position: number, layer: string, score: number }>} */
  const items = [];
  for (const row of rows || []) {
    const similarId = toCatalogId(row.similarId ?? row.id);
    if (similarId == null || similarId === srcId) continue;
    const layer = normalizeLayer(row.layer);
    if (!layer) continue;
    items.push({
      similarId,
      position: Math.max(1, Number(row.position) || items.length + 1),
      layer,
      score: Math.max(0, Number(row.score) || 0),
    });
  }

  if (!items.length) {
    await MusicSimilarCache.deleteMany({ sourceId: srcId, contentType: type });
    return { written: 0, batchId: null };
  }

  const now = new Date();
  const batchId = crypto.randomBytes(12).toString('hex');
  const ops = items.map((item) => ({
    updateOne: {
      filter: {
        sourceId: srcId,
        contentType: type,
        similarId: item.similarId,
      },
      update: {
        $set: {
          position: item.position,
          layer: item.layer,
          score: item.score,
          generatedAt: now,
          batchId,
        },
      },
      upsert: true,
    },
  }));

  await MusicSimilarCache.bulkWrite(ops, { ordered: false });
  await MusicSimilarCache.deleteMany({
    sourceId: srcId,
    contentType: type,
    batchId: { $ne: batchId },
  });

  return { written: items.length, batchId };
};

/**
 * Cache qatorlari — position ASC.
 *
 * @param {unknown} contentType
 * @param {string|number} sourceId
 * @param {{ limit?: number }} [options]
 * @returns {Promise<Array<{ sourceId: number, contentType: string, similarId: number, position: number, layer: string, score: number, generatedAt: Date|null }>>}
 */
const listSimilarCacheRows = async (contentType, sourceId, options = {}) => {
  const type = normalizeContentType(contentType);
  const srcId = toCatalogId(sourceId);
  if (!type || srcId == null) return [];

  const limit = Number(options.limit);
  let query = MusicSimilarCache.find({ sourceId: srcId, contentType: type })
    .select({
      _id: 0,
      sourceId: 1,
      contentType: 1,
      similarId: 1,
      position: 1,
      layer: 1,
      score: 1,
      generatedAt: 1,
    })
    .sort({ position: 1 });

  if (Number.isFinite(limit) && limit > 0) {
    query = query.limit(Math.floor(limit));
  }

  const rows = await query.lean();
  return (rows || []).map((row) => ({
    sourceId: Number(row.sourceId),
    contentType: String(row.contentType || type),
    similarId: Number(row.similarId),
    position: Number(row.position) || 0,
    layer: String(row.layer || ''),
    score: Number(row.score) || 0,
    generatedAt: row.generatedAt || null,
  }));
};

/**
 * Cache + katalog hydrate (FE uchun tayyor).
 *
 * @param {unknown} contentType
 * @param {string|number} sourceId
 * @param {{ limit?: number }} [options]
 * @returns {Promise<Array<{ sourceId: number, contentType: string, similarId: number, position: number, layer: string, score: number, item: object|null }>>}
 */
const listSimilarWithItems = async (contentType, sourceId, options = {}) => {
  const type = normalizeContentType(contentType);
  const rows = await listSimilarCacheRows(type, sourceId, options);
  if (!rows.length || !type) return [];

  const catalog = await findCatalogItemsByIds(
    type,
    rows.map((r) => r.similarId)
  );
  const byId = new Map(catalog.map((m) => [Number(m.id), m]));

  return rows.map((row) => ({
    ...row,
    item: byId.get(row.similarId) || null,
  }));
};

/**
 * @param {unknown} contentType
 * @param {string|number} sourceId
 * @returns {Promise<number>}
 */
const clearSimilarForSource = async (contentType, sourceId) => {
  const type = normalizeContentType(contentType);
  const srcId = toCatalogId(sourceId);
  if (!type || srcId == null) return 0;
  const result = await MusicSimilarCache.deleteMany({
    sourceId: srcId,
    contentType: type,
  });
  return Number(result?.deletedCount) || 0;
};

module.exports = {
  replaceSimilarForSource,
  listSimilarCacheRows,
  listSimilarWithItems,
  clearSimilarForSource,
};
