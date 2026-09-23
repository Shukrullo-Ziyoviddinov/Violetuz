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

module.exports = {
  listHomeFeedCache,
  replaceHomeFeedCache,
};
