/**
 * Precomputed Top-N recommendation cache access.
 *
 * @module recommendation/repositories/userRecommendation.repository
 */

'use strict';

const crypto = require('crypto');
const { UserRecommendation } = require('../models');

/**
 * Replace full Top-N cache for user × category.
 * Upsert new batch first, then delete other batchIds — avoids empty-window race
 * from deleteMany + insertMany under concurrent precompute jobs.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} category
 * @param {Array<{ movieId: string|number, score: number, rank?: number }>} items
 * @returns {Promise<{ written: number, batchId: string|null }>}
 */
const replaceUserCategoryRecommendations = async (userId, category, items) => {
  const cat = String(category).trim();
  const now = new Date();
  const batchId = crypto.randomBytes(12).toString('hex');

  if (!Array.isArray(items) || items.length === 0) {
    await UserRecommendation.deleteMany({ userId, category: cat });
    return { written: 0, batchId: null };
  }

  const ops = items.map((item, index) => ({
    updateOne: {
      filter: {
        userId,
        category: cat,
        movieId: String(item.movieId),
      },
      update: {
        $set: {
          score: item.score,
          rank: item.rank ?? index + 1,
          generatedAt: now,
          batchId,
        },
        $setOnInsert: {
          userId,
          category: cat,
          movieId: String(item.movieId),
        },
      },
      upsert: true,
    },
  }));

  await UserRecommendation.bulkWrite(ops, { ordered: false });

  await UserRecommendation.deleteMany({
    userId,
    category: cat,
    batchId: { $ne: batchId },
  });

  return { written: items.length, batchId };
};

/**
 * Serve path: indexed Top-N read (no movie full-scan).
 * Sort by rank ASC so diversity re-ordering from precompute is preserved.
 * (score is kept for display/debug — not used as primary order.)
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} category
 * @param {number} [limit]
 * @returns {Promise<Array<{ movieId: string, score: number, rank: number|null, generatedAt: Date }>>}
 */
const listCachedRecommendations = async (userId, category, limit = 120) => {
  const cat = String(category).trim();
  return UserRecommendation.find({ userId, category: cat })
    .select({ movieId: 1, score: 1, rank: 1, generatedAt: 1, _id: 0 })
    .sort({ rank: 1, score: -1 })
    .limit(Math.max(1, limit))
    .lean();
};

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} category
 * @returns {Promise<boolean>}
 */
const hasCachedRecommendations = async (userId, category) => {
  const found = await UserRecommendation.exists({
    userId,
    category: String(category).trim(),
  });
  return Boolean(found);
};

module.exports = {
  replaceUserCategoryRecommendations,
  listCachedRecommendations,
  hasCachedRecommendations,
};
