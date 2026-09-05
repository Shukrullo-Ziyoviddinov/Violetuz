/**
 * category_trending_scores access.
 *
 * @module recommendation/repositories/trending.repository
 */

'use strict';

const { CategoryTrendingScore } = require('../models');

/**
 * @param {string} category
 * @param {string|number} movieId
 * @returns {Promise<Object|null>}
 */
const getTrendingScore = async (category, movieId) => {
  const cat = String(category || '').trim();
  const id = String(movieId ?? '').trim();
  if (!cat || !id) return null;

  return CategoryTrendingScore.findOne({ category: cat, movieId: id })
    .select({
      category: 1,
      movieId: 1,
      viewCountRecent: 1,
      avgWatchDuration: 1,
      likeCount: 1,
      completionRateAvg: 1,
      trendingScore: 1,
      updatedAt: 1,
      _id: 0,
    })
    .lean();
};

/**
 * Map movieId → { score, source } for a category (blending / precompute).
 * Plain number values still accepted by resolveTrendingScore for back-compat.
 *
 * @param {string} category
 * @param {Array<string|number>} [movieIds]
 * @returns {Promise<Map<string, { score: number, source: 'trending'|'popularity' }>>}
 */
const getTrendingScoreMap = async (category, movieIds = null) => {
  const cat = String(category || '').trim();
  /** @type {Map<string, { score: number, source: 'trending'|'popularity' }>} */
  const map = new Map();
  if (!cat) return map;

  /** @type {Object} */
  const filter = { category: cat };
  if (Array.isArray(movieIds) && movieIds.length) {
    filter.movieId = {
      $in: [...new Set(movieIds.map((id) => String(id)).filter(Boolean))],
    };
  }

  const rows = await CategoryTrendingScore.find(filter)
    .select({ movieId: 1, trendingScore: 1, scoreSource: 1, _id: 0 })
    .lean();

  for (const row of rows) {
    const source = row.scoreSource === 'popularity' ? 'popularity' : 'trending';
    map.set(String(row.movieId), {
      score: Number(row.trendingScore) || 0,
      source,
    });
  }
  return map;
};

/**
 * Top-N by trendingScore DESC.
 * @param {string} category
 * @param {number} [limit]
 * @returns {Promise<Object[]>}
 */
const listTopTrending = async (category, limit = 120) => {
  const cat = String(category || '').trim();
  if (!cat) return [];

  return CategoryTrendingScore.find({ category: cat })
    .select({
      movieId: 1,
      trendingScore: 1,
      viewCountRecent: 1,
      avgWatchDuration: 1,
      likeCount: 1,
      completionRateAvg: 1,
      updatedAt: 1,
      _id: 0,
    })
    .sort({ trendingScore: -1 })
    .limit(Math.max(1, limit))
    .lean();
};

/**
 * Upsert one row.
 * @param {Object} row
 * @returns {Promise<Object>}
 */
const upsertTrendingScore = async (row) => {
  const category = String(row.category || '').trim();
  const movieId = String(row.movieId ?? '').trim();
  const now = row.updatedAt instanceof Date ? row.updatedAt : new Date();

  return CategoryTrendingScore.findOneAndUpdate(
    { category, movieId },
    {
      $set: {
        viewCountRecent: Math.max(0, Number(row.viewCountRecent) || 0),
        avgWatchDuration: Math.max(0, Number(row.avgWatchDuration) || 0),
        likeCount: Math.max(0, Number(row.likeCount) || 0),
        completionRateAvg: Math.min(
          1,
          Math.max(0, Number(row.completionRateAvg) || 0)
        ),
        trendingScore: Math.max(0, Number(row.trendingScore) || 0),
        scoreSource: row.scoreSource === 'popularity' ? 'popularity' : 'trending',
        updatedAt: now,
      },
      $setOnInsert: { category, movieId },
    },
    { upsert: true, new: true, lean: true }
  );
};

/**
 * Replace full category trending set (upsert batch, then drop stale).
 * Parallel-safe via batchId-style: upsert all, delete rows not in movieId set
 * with older updatedAt — here we delete movieIds not in the new set.
 *
 * @param {string} category
 * @param {Array<Object>} rows
 * @returns {Promise<{ written: number }>}
 */
const replaceCategoryTrendingScores = async (category, rows) => {
  const cat = String(category || '').trim();
  if (!cat) return { written: 0 };

  const now = new Date();
  const list = Array.isArray(rows) ? rows : [];

  if (!list.length) {
    await CategoryTrendingScore.deleteMany({ category: cat });
    return { written: 0 };
  }

  const ops = list.map((row) => {
    const movieId = String(row.movieId ?? '').trim();
    return {
      updateOne: {
        filter: { category: cat, movieId },
        update: {
          $set: {
            viewCountRecent: Math.max(0, Number(row.viewCountRecent) || 0),
            avgWatchDuration: Math.max(0, Number(row.avgWatchDuration) || 0),
            likeCount: Math.max(0, Number(row.likeCount) || 0),
            completionRateAvg: Math.min(
              1,
              Math.max(0, Number(row.completionRateAvg) || 0)
            ),
            trendingScore: Math.max(0, Number(row.trendingScore) || 0),
            scoreSource: row.scoreSource === 'popularity' ? 'popularity' : 'trending',
            updatedAt: now,
          },
          $setOnInsert: { category: cat, movieId },
        },
        upsert: true,
      },
    };
  });

  await CategoryTrendingScore.bulkWrite(ops, { ordered: false });

  const keepIds = list.map((r) => String(r.movieId)).filter(Boolean);
  await CategoryTrendingScore.deleteMany({
    category: cat,
    movieId: { $nin: keepIds },
  });

  return { written: keepIds.length };
};

/**
 * Category bo‘yicha eng so‘nggi trending updatedAt (cache freshness uchun).
 * @param {string} category
 * @returns {Promise<Date|null>}
 */
const getCategoryTrendingUpdatedAt = async (category) => {
  const cat = String(category || '').trim();
  if (!cat) return null;

  const row = await CategoryTrendingScore.findOne({ category: cat })
    .select({ updatedAt: 1, _id: 0 })
    .sort({ updatedAt: -1 })
    .lean();

  if (!row?.updatedAt) return null;
  const t = row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt);
  return Number.isNaN(t.getTime()) ? null : t;
};

module.exports = {
  getTrendingScore,
  getTrendingScoreMap,
  listTopTrending,
  upsertTrendingScore,
  replaceCategoryTrendingScores,
  getCategoryTrendingUpdatedAt,
};
