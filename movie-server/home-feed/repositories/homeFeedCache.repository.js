/**
 * home_feed_cache yozuvi va o'qishi.
 * recommendation_user_recommendations ga tegmaydi.
 *
 * @module home-feed/repositories/homeFeedCache.repository
 */

'use strict';

const crypto = require('crypto');
const { HomeFeedCache } = require('../models');
const { parseUserId } = require('./parseUserId');

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<Array<{ movieId: string, position: number, score: number, sourceType: string, generatedAt: Date|null }>>}
 */
const listHomeFeedCache = async (userId) => {
  const uid = parseUserId(userId);
  if (!uid) return [];

  const rows = await HomeFeedCache.find({ userId: uid })
    .select({
      movieId: 1,
      position: 1,
      score: 1,
      sourceType: 1,
      generatedAt: 1,
      _id: 0,
    })
    .sort({ position: 1 })
    .lean();

  return (rows || []).map((row) => ({
    movieId: String(row.movieId),
    position: Number(row.position) || 0,
    score: Number(row.score) || 0,
    sourceType: row.sourceType,
    generatedAt: row.generatedAt || null,
  }));
};

/**
 * Foydalanuvchining lentasini to'liq almashtiradi.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {Array<{ movieId: string, position: number, score: number, sourceType: string }>} movies
 * @returns {Promise<{ written: number, batchId: string|null }>}
 */
const replaceHomeFeedCache = async (userId, movies) => {
  const uid = parseUserId(userId);
  if (!uid) return { written: 0, batchId: null };

  const items = Array.isArray(movies) ? movies : [];
  if (!items.length) {
    await HomeFeedCache.deleteMany({ userId: uid });
    return { written: 0, batchId: null };
  }

  const now = new Date();
  const batchId = crypto.randomBytes(12).toString('hex');
  const ops = items.map((item) => ({
    updateOne: {
      filter: {
        userId: uid,
        movieId: String(item.movieId),
      },
      update: {
        $set: {
          position: item.position,
          score: item.score,
          sourceType: item.sourceType,
          generatedAt: now,
          batchId,
        },
        $setOnInsert: {
          userId: uid,
          movieId: String(item.movieId),
        },
      },
      upsert: true,
    },
  }));

  await HomeFeedCache.bulkWrite(ops, { ordered: false });
  await HomeFeedCache.deleteMany({
    userId: uid,
    batchId: { $ne: batchId },
  });

  return { written: items.length, batchId };
};

/**
 * Cache yangilangan vaqt. To'liq lentani o'qimaydi.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<Date|null>}
 */
const getHomeFeedCacheStamp = async (userId) => {
  const uid = parseUserId(userId);
  if (!uid) return null;
  const row = await HomeFeedCache.findOne({ userId: uid })
    .select({ generatedAt: 1, _id: 0 })
    .lean();
  return row?.generatedAt || null;
};

/**
 * Tartib bo'yicha sahifa. Faqat so'ralgan qatorlar o'qiladi.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {{ offset?: number, limit?: number, excludeIds?: string[] }} [page]
 * @returns {Promise<{ movies: Object[], hasMore: boolean }>}
 */
const listHomeFeedCachePage = async (userId, { offset = 0, limit = 10, excludeIds = [] } = {}) => {
  const uid = parseUserId(userId);
  if (!uid) return { movies: [], hasMore: false };

  const skip = Math.max(0, Number(offset) || 0);
  const take = Math.max(1, Number(limit) || 10);
  const exclude = (Array.isArray(excludeIds) ? excludeIds : [])
    .map((id) => String(id).trim())
    .filter(Boolean);
  const filter = { userId: uid };
  if (exclude.length) filter.movieId = { $nin: exclude };

  const [rows, total] = await Promise.all([
    HomeFeedCache.find(filter)
      .select({
        movieId: 1,
        position: 1,
        score: 1,
        sourceType: 1,
        _id: 0,
      })
      .sort({ position: 1 })
      .skip(skip)
      .limit(take)
      .lean(),
    HomeFeedCache.countDocuments(filter),
  ]);

  const movies = (rows || []).map((row) => ({
    movieId: String(row.movieId),
    position: Number(row.position) || 0,
    score: Number(row.score) || 0,
    sourceType: row.sourceType,
  }));

  return {
    movies,
    hasMore: skip + movies.length < total,
  };
};

module.exports = {
  listHomeFeedCache,
  getHomeFeedCacheStamp,
  listHomeFeedCachePage,
  replaceHomeFeedCache,
};
