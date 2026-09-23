/**
 * Trend ballari — faqat o'qish.
 * Collection: recommendation_category_trending_scores
 * Bo'lim trending jobiga yozilmaydi.
 *
 * @module home-feed/repositories/trending.read
 */

'use strict';

const { CategoryTrendingScore } = require('../../recommendation/models');
const { homeFeedWeights } = require('../config/homeFeedWeights');
const { excludedCategoryMatch, isExcludedCategory } = require('./excludedCategory');

/**
 * Har bir bo'limdan eng yuqori trend qatorlari.
 * trendingScore shu bo'lim ichida 0..1. Boshqa bo'lim bilan qo‘shilmaydi.
 *
 * @param {number} [limitPerCategory]
 * @returns {Promise<Array<{ movieId: string, category: string, trendingScore: number, scoreSource: string, sourceType: 'trending' }>>}
 */
const listTrendingCandidates = async (limitPerCategory) => {
  const perCategory = Math.max(
    1,
    Number(limitPerCategory) || homeFeedWeights.candidateLimits.trendingPerCategory
  );

  const groups = await CategoryTrendingScore.aggregate([
    { $match: { ...excludedCategoryMatch() } },
    { $sort: { trendingScore: -1 } },
    {
      $group: {
        _id: '$category',
        items: {
          $push: {
            movieId: '$movieId',
            trendingScore: '$trendingScore',
            scoreSource: '$scoreSource',
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

  /** @type {Array<{ movieId: string, category: string, trendingScore: number, scoreSource: string, sourceType: 'trending' }>} */
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
