/**
 * Ko'rish progressi — faqat o'qish.
 * Collection: recommendation_user_movie_progress
 * upsert / affinity yozuvi yo'q.
 *
 * "Ko'rildi" chegarasi bo'lim algoritmidagi progress bilan bir xil
 * (kamida 5 daqiqa, yoki qisqa filmda ~80%). Shu config faqat o'qiladi.
 *
 * @module home-feed/repositories/watchProgress.read
 */

'use strict';

const { UserMovieProgress } = require('../../recommendation/models');
const { scoringWeights } = require('../../recommendation/config/scoringWeights');
const { isExcludedCategory, excludedCategoryMatch } = require('./excludedCategory');
const { parseUserId } = require('./parseUserId');

const DEFAULT_LIMIT = 500;

/**
 * @param {number} watchedSeconds
 * @param {number} completionRate
 * @returns {boolean}
 */
const isWatchedProgress = (watchedSeconds, completionRate) => {
  const cfg = scoringWeights.progress || {};
  const minSec = cfg.minWatchedSeconds ?? 300;
  const shortRatio = cfg.shortFilmCompleteRatio ?? 0.8;
  return watchedSeconds >= minSec || completionRate >= shortRatio;
};

/**
 * Foydalanuvchining barcha bo'limlardagi progressi. anonslar yo'q.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {number} [limit]
 * @returns {Promise<Array<{ movieId: string, category: string, watchedSeconds: number, completionRate: number, updatedAt: Date|null, watched: boolean }>>}
 */
const listWatchProgress = async (userId, limit = DEFAULT_LIMIT) => {
  const uid = parseUserId(userId);
  if (!uid) return [];

  const rows = await UserMovieProgress.find({
    userId: uid,
    ...excludedCategoryMatch(),
  })
    .select({
      movieId: 1,
      category: 1,
      watchedSeconds: 1,
      completionRate: 1,
      updatedAt: 1,
      _id: 0,
    })
    .sort({ updatedAt: -1 })
    .limit(Math.max(1, Number(limit) || DEFAULT_LIMIT))
    .lean();

  /** @type {Array<{ movieId: string, category: string, watchedSeconds: number, completionRate: number, updatedAt: Date|null, watched: boolean }>} */
  const out = [];
  for (const row of rows || []) {
    const category = String(row.category || '').trim();
    const movieId = String(row.movieId || '').trim();
    if (!movieId || !category || isExcludedCategory(category)) continue;
    const watchedSeconds = Math.max(0, Number(row.watchedSeconds) || 0);
    const completionRate = Math.min(1, Math.max(0, Number(row.completionRate) || 0));
    out.push({
      movieId,
      category,
      watchedSeconds,
      completionRate,
      updatedAt: row.updatedAt || null,
      watched: isWatchedProgress(watchedSeconds, completionRate),
    });
  }
  return out;
};

module.exports = {
  listWatchProgress,
  isWatchedProgress,
};
