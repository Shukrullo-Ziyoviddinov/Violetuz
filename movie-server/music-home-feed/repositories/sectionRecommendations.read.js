/**
 * Bo'lim tavsiya cache — faqat o'qish.
 * Collection: music_recommendation_user_recommendations
 * Yozuv yo'q. serve.service / precompute chaqirilmaydi.
 * Faqat contentType music.
 *
 * @module music-home-feed/repositories/sectionRecommendations.read
 */

'use strict';

const { UserMusicRecommendation } = require('../../recommendation-music/models');
const { musicHomeFeedWeights } = require('../config/musicHomeFeedWeights');
const { isMusicContentType, musicContentMatch } = require('./musicContent');
const { parseUserId } = require('./parseUserId');

/**
 * Har bir categoryNameMusic dan tayyor Top-N. Faqat qo'shiq.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {number} [limitPerCategory]
 * @returns {Promise<Array<{ contentId: string, category: string, score: number, rank: number|null, generatedAt: Date|null, sourceType: 'personal' }>>}
 */
const listPersonalCandidates = async (userId, limitPerCategory) => {
  const uid = parseUserId(userId);
  if (!uid) return [];

  const perCategory = Math.max(
    1,
    Number(limitPerCategory) || musicHomeFeedWeights.candidateLimits.personalPerCategory
  );

  const groups = await UserMusicRecommendation.aggregate([
    { $match: { userId: uid, ...musicContentMatch() } },
    { $sort: { rank: 1, score: -1 } },
    {
      $group: {
        _id: '$category',
        items: {
          $push: {
            contentId: '$contentId',
            score: '$score',
            rank: '$rank',
            generatedAt: '$generatedAt',
            contentType: '$contentType',
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

  /** @type {Array<{ contentId: string, category: string, score: number, rank: number|null, generatedAt: Date|null, sourceType: 'personal' }>} */
  const out = [];
  for (const group of groups) {
    const category = String(group.category || '').trim();
    if (!category) continue;
    for (const item of group.items || []) {
      if (!isMusicContentType(item.contentType)) continue;
      const contentId = String(item.contentId || '').trim();
      if (!contentId) continue;
      out.push({
        contentId,
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
