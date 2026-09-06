/**
 * music_recommendation_category_trending_scores access.
 *
 * @module recommendation-music/repositories/trending.repository
 */

'use strict';

const { CategoryMusicTrendingScore } = require('../models');
const { normalizeContentType, isValidContentType } = require('../utils/contentKey');

/**
 * Map contentId → { score, source } for category × contentType.
 *
 * @param {string} category
 * @param {string} contentType
 * @param {Array<string|number>} [contentIds]
 * @returns {Promise<Map<string, { score: number, source: 'trending'|'popularity' }>>}
 */
const getTrendingScoreMap = async (category, contentType, contentIds = null) => {
  const cat = String(category || '').trim();
  const type = normalizeContentType(contentType);
  /** @type {Map<string, { score: number, source: 'trending'|'popularity' }>} */
  const map = new Map();
  if (!cat || !isValidContentType(type)) return map;

  /** @type {Object} */
  const filter = { category: cat, contentType: type };
  if (Array.isArray(contentIds) && contentIds.length) {
    filter.contentId = {
      $in: [...new Set(contentIds.map((id) => String(id)).filter(Boolean))],
    };
  }

  const rows = await CategoryMusicTrendingScore.find(filter)
    .select({ contentId: 1, trendingScore: 1, scoreSource: 1, _id: 0 })
    .lean();

  for (const row of rows) {
    const source = row.scoreSource === 'popularity' ? 'popularity' : 'trending';
    map.set(String(row.contentId), {
      score: Number(row.trendingScore) || 0,
      source,
    });
  }
  return map;
};

/**
 * Replace trending rows for one category × contentType.
 *
 * @param {string} category
 * @param {string} contentType
 * @param {Array<Object>} rows
 * @returns {Promise<{ written: number }>}
 */
const replaceCategoryTypeTrendingScores = async (category, contentType, rows) => {
  const cat = String(category || '').trim();
  const type = normalizeContentType(contentType);
  if (!cat || !isValidContentType(type)) return { written: 0 };

  const now = new Date();
  const list = Array.isArray(rows) ? rows : [];

  if (!list.length) {
    await CategoryMusicTrendingScore.deleteMany({ category: cat, contentType: type });
    return { written: 0 };
  }

  const ops = list.map((row) => {
    const contentId = String(row.contentId ?? '').trim();
    return {
      updateOne: {
        filter: { category: cat, contentType: type, contentId },
        update: {
          $set: {
            viewCountRecent: Math.max(0, Number(row.viewCountRecent) || 0),
            avgListenDuration: Math.max(
              0,
              Number(row.avgListenDuration ?? row.avgWatchDuration) || 0
            ),
            likeCount: Math.max(0, Number(row.likeCount) || 0),
            completionRateAvg: Math.min(
              1,
              Math.max(0, Number(row.completionRateAvg) || 0)
            ),
            trendingScore: Math.max(0, Number(row.trendingScore) || 0),
            scoreSource:
              row.scoreSource === 'popularity' ? 'popularity' : 'trending',
            updatedAt: now,
          },
          $setOnInsert: { category: cat, contentType: type, contentId },
        },
        upsert: true,
      },
    };
  });

  await CategoryMusicTrendingScore.bulkWrite(ops, { ordered: false });

  const keepIds = list.map((r) => String(r.contentId)).filter(Boolean);
  await CategoryMusicTrendingScore.deleteMany({
    category: cat,
    contentType: type,
    contentId: { $nin: keepIds },
  });

  return { written: keepIds.length };
};

/**
 * Latest trending updatedAt for category (+ optional contentType).
 * @param {string} category
 * @param {string} [contentType]
 * @returns {Promise<Date|null>}
 */
const getCategoryTrendingUpdatedAt = async (category, contentType = null) => {
  const cat = String(category || '').trim();
  if (!cat) return null;

  /** @type {Object} */
  const filter = { category: cat };
  const type = normalizeContentType(contentType);
  if (type && isValidContentType(type)) filter.contentType = type;

  const row = await CategoryMusicTrendingScore.findOne(filter)
    .select({ updatedAt: 1, _id: 0 })
    .sort({ updatedAt: -1 })
    .lean();

  if (!row?.updatedAt) return null;
  const t = row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt);
  return Number.isNaN(t.getTime()) ? null : t;
};

module.exports = {
  getTrendingScoreMap,
  replaceCategoryTypeTrendingScores,
  getCategoryTrendingUpdatedAt,
};
