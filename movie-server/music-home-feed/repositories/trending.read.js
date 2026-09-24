/**
 * Trend ballari — faqat o'qish.
 * Collection: music_recommendation_category_trending_scores
 * Trending jobiga yozilmaydi. Faqat contentType music.
 *
 * @module music-home-feed/repositories/trending.read
 */

'use strict';

const { CategoryMusicTrendingScore } = require('../../recommendation-music/models');
const { musicHomeFeedWeights } = require('../config/musicHomeFeedWeights');
const { isMusicContentType, musicContentMatch } = require('./musicContent');

/**
 * Har bir bo'limdan eng yuqori trend qo'shiqlari.
 * trendingScore shu bo'lim ichida. Boshqa bo'lim bilan qo'shilmaydi.
 *
 * @param {number} [limitPerCategory]
 * @returns {Promise<Array<{ contentId: string, category: string, trendingScore: number, scoreSource: string, sourceType: 'trending' }>>}
 */
const listTrendingCandidates = async (limitPerCategory) => {
  const perCategory = Math.max(
    1,
    Number(limitPerCategory) || musicHomeFeedWeights.candidateLimits.trendingPerCategory
  );

  const groups = await CategoryMusicTrendingScore.aggregate([
    { $match: { ...musicContentMatch() } },
    { $sort: { trendingScore: -1 } },
    {
      $group: {
        _id: '$category',
        items: {
          $push: {
            contentId: '$contentId',
            trendingScore: '$trendingScore',
            scoreSource: '$scoreSource',
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

  /** @type {Array<{ contentId: string, category: string, trendingScore: number, scoreSource: string, sourceType: 'trending' }>} */
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
        trendingScore: Number(item.trendingScore) || 0,
        scoreSource: item.scoreSource === 'popularity' ? 'popularity' : 'trending',
        sourceType: 'trending',
      });
    }
  }
  return out;
};

module.exports = {
  listTrendingCandidates,
};
