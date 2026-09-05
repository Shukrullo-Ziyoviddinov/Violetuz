/**
 * Precomputed Top-N music recommendation cache.
 * Scoped by user × categoryNameMusic × contentType (music|album|clip|concert).
 *
 * @module recommendation-music/repositories/userRecommendation.repository
 */

'use strict';

const crypto = require('crypto');
const { UserMusicRecommendation } = require('../models');
const { normalizeContentType, isValidContentType } = require('../utils/contentKey');

const replaceUserCategoryRecommendations = async (
  userId,
  category,
  items,
  options = {}
) => {
  const cat = String(category).trim();
  const contentType = normalizeContentType(options.contentType);
  const typeFilter =
    contentType && isValidContentType(contentType) ? contentType : null;
  const now = new Date();
  const batchId = crypto.randomBytes(12).toString('hex');

  const scopeFilter = typeFilter
    ? { userId, category: cat, contentType: typeFilter }
    : { userId, category: cat };

  if (!Array.isArray(items) || items.length === 0) {
    await UserMusicRecommendation.deleteMany(scopeFilter);
    return { written: 0, batchId: null };
  }

  const ops = items.map((item, index) => ({
    updateOne: {
      filter: {
        userId,
        category: cat,
        contentKey: String(item.contentKey),
      },
      update: {
        $set: {
          contentType: String(item.contentType),
          contentId: String(item.contentId),
          score: item.score,
          rank: item.rank ?? index + 1,
          generatedAt: now,
          batchId,
        },
        $setOnInsert: {
          userId,
          category: cat,
          contentKey: String(item.contentKey),
        },
      },
      upsert: true,
    },
  }));

  await UserMusicRecommendation.bulkWrite(ops, { ordered: false });

  await UserMusicRecommendation.deleteMany({
    ...scopeFilter,
    batchId: { $ne: batchId },
  });

  return { written: items.length, batchId };
};

const listCachedRecommendations = async (
  userId,
  category,
  limit = 120,
  options = {}
) => {
  const cat = String(category).trim();
  const contentType = normalizeContentType(options.contentType);
  const filter = { userId, category: cat };
  if (contentType && isValidContentType(contentType)) {
    filter.contentType = contentType;
  }

  return UserMusicRecommendation.find(filter)
    .select({
      contentKey: 1,
      contentType: 1,
      contentId: 1,
      score: 1,
      rank: 1,
      generatedAt: 1,
      _id: 0,
    })
    .sort({ rank: 1, score: -1 })
    .limit(Math.max(1, limit))
    .lean();
};

module.exports = {
  replaceUserCategoryRecommendations,
  listCachedRecommendations,
};
