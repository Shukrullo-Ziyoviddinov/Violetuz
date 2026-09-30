/**
 * movie_similar_cache — yozish / o'qish.
 * Sahifa hisoblamaydi; fon job shu yerga yozadi, GET cache dan o'qiydi.
 *
 * @module movie-similar/repositories/similarCache.repository
 */

'use strict';

const crypto = require('crypto');
const { MovieSimilarCache } = require('../models');
const { similarityWeights } = require('../config/similarityWeights');
const {
  toMovieId,
  findCatalogMoviesByIds,
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
 * Bitta kino uchun cache ni almashtirish.
 *
 * @param {string|number} movieId
 * @param {Array<{ movieId?: number, similarMovieId?: number, position?: number, layer?: string, score?: number }>} rows
 * @returns {Promise<{ written: number, batchId: string|null }>}
 */
const replaceSimilarForMovie = async (movieId, rows) => {
  const sourceId = toMovieId(movieId);
  if (sourceId == null) return { written: 0, batchId: null };

  /** @type {Array<{ similarMovieId: number, position: number, layer: string, score: number }>} */
  const items = [];
  for (const row of rows || []) {
    const similarMovieId = toMovieId(row.similarMovieId ?? row.movieId);
    if (similarMovieId == null || similarMovieId === sourceId) continue;
    const layer = normalizeLayer(row.layer);
    if (!layer) continue;
    items.push({
      similarMovieId,
      position: Math.max(1, Number(row.position) || items.length + 1),
      layer,
      score: Math.max(0, Number(row.score) || 0),
    });
  }

  if (!items.length) {
    await MovieSimilarCache.deleteMany({ movieId: sourceId });
    return { written: 0, batchId: null };
  }

  const now = new Date();
  const batchId = crypto.randomBytes(12).toString('hex');
  const ops = items.map((item) => ({
    updateOne: {
      filter: {
        movieId: sourceId,
        similarMovieId: item.similarMovieId,
      },
      // movieId / similarMovieId faqat filterda — $setOnInsert da conflict bo'lmasin
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

  await MovieSimilarCache.bulkWrite(ops, { ordered: false });
  await MovieSimilarCache.deleteMany({
    movieId: sourceId,
    batchId: { $ne: batchId },
  });

  return { written: items.length, batchId };
};

/**
 * Cache qatorlari — position ASC (qatlam tartibi engine da yozilgan).
 *
 * @param {string|number} movieId
 * @param {{ limit?: number }} [options]
 * @returns {Promise<Array<{ movieId: number, similarMovieId: number, position: number, layer: string, score: number, generatedAt: Date|null }>>}
 */
const listSimilarCacheRows = async (movieId, options = {}) => {
  const sourceId = toMovieId(movieId);
  if (sourceId == null) return [];

  const limit = Number(options.limit);
  let query = MovieSimilarCache.find({ movieId: sourceId })
    .select({
      _id: 0,
      movieId: 1,
      similarMovieId: 1,
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
    movieId: Number(row.movieId),
    similarMovieId: Number(row.similarMovieId),
    position: Number(row.position) || 0,
    layer: String(row.layer || ''),
    score: Number(row.score) || 0,
    generatedAt: row.generatedAt || null,
  }));
};

/**
 * Cache + katalog hydrate (FE uchun tayyor).
 *
 * @param {string|number} movieId
 * @param {{ limit?: number }} [options]
 * @returns {Promise<Array<{ movieId: number, similarMovieId: number, position: number, layer: string, score: number, movie: object|null }>>}
 */
const listSimilarWithMovies = async (movieId, options = {}) => {
  const rows = await listSimilarCacheRows(movieId, options);
  if (!rows.length) return [];

  const catalog = await findCatalogMoviesByIds(rows.map((r) => r.similarMovieId));
  const byId = new Map(catalog.map((m) => [Number(m.id), m]));

  return rows.map((row) => ({
    ...row,
    movie: byId.get(row.similarMovieId) || null,
  }));
};

/**
 * @param {string|number} movieId
 * @returns {Promise<number>}
 */
const clearSimilarForMovie = async (movieId) => {
  const sourceId = toMovieId(movieId);
  if (sourceId == null) return 0;
  const result = await MovieSimilarCache.deleteMany({ movieId: sourceId });
  return Number(result?.deletedCount) || 0;
};

module.exports = {
  replaceSimilarForMovie,
  listSimilarCacheRows,
  listSimilarWithMovies,
  clearSimilarForMovie,
};
