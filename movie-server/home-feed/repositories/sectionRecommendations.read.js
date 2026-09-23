/**
 * Bo'lim tavsiya cache — faqat o'qish.
 * Collection: recommendation_user_recommendations
 * Yozuv yo'q. getRecommendationsByCategory chaqirilmaydi.
 *
 * @module home-feed/repositories/sectionRecommendations.read
 */

'use strict';

const { UserRecommendation } = require('../../recommendation/models');
const { homeFeedWeights } = require('../config/homeFeedWeights');
const { excludedCategoryMatch, isExcludedCategory } = require('./excludedCategory');
const { parseUserId } = require('./parseUserId');

/**
 * Har bir categoryName dan tayyor Top-N.
 * Score bo'lim ichidagi ball — keyingi qadam normallaydi.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {number} [limitPerCategory]
 * @returns {Promise<Array<{ movieId: string, category: string, score: number, rank: number|null, generatedAt: Date|null, sourceType: 'personal' }>>}
 */
const listPersonalCandidates = async (userId, limitPerCategory) => {
  const uid = parseUserId(userId);
  if (!uid) return [];

  const perCategory = Math.max(
    1,
    Number(limitPerCategory) || homeFeedWeights.candidateLimits.personalPerCategory
  );

  const groups = await UserRecommendation.aggregate([
    { $match: { userId: uid, ...excludedCategoryMatch() } },
    { $sort: { rank: 1, score: -1 } },
    {
      $group: {
        _id: '$category',
        items: {
          $push: {
            movieId: '$movieId',
            score: '$score',
            rank: '$rank',
            generatedAt: '$generatedAt',
          },
        },
      },
    },
    {
      $project: {
        category: '$_id',
        items: { $slice: ['$items', perCategory] },
        _id: 0,
      },
    },
  ]);

  /** @type {Array<{ movieId: string, category: string, score: number, rank: number|null, generatedAt: Date|null, sourceType: 'personal' }>} */
  const out = [];
  for (const group of groups) {
    const category = String(group.category || '').trim();
    if (!category || isExcludedCategory(category)) continue;
    for (const item of group.items || []) {
      const movieId = String(item.movieId || '').trim();
      if (!movieId) continue;
      out.push({
        movieId,
        category,
        score: Number(item.score) || 0,
        rank: item.rank == null ? null : Number(item.rank),
        generatedAt: item.generatedAt || null,
        sourceType: 'personal',
      });
    }
  }
  return out;
};

module.exports = {
  listPersonalCandidates,
};
