/**
 * User experience (confidence α) — per user × category.
 *
 * experienceCount = | qualityWatchMovieIds ∪ likedMovieIdsInCategory |
 *
 * Sources (TTL-safe):
 *   1) UserMovieProgress — DISTINCT movieId, completionRate > qualityMinCompletion
 *      (WatchEvent TTL o‘chsa ham α saqlanadi)
 *   2) UserReaction — movie like, keyin Movie.categoryName = category
 *
 * Noto‘g‘ri yo‘llar (qilmaymiz):
 *   - Like paytida soxta WatchEvent yozish
 *   - Oddiy COUNT(events) / WatchEvent ga tayanib α hisoblash
 *   - Watch + Like ni qo‘shib hisoblash (bir film ikki marta)
 *
 * @module recommendation/repositories/userExperience.repository
 */

'use strict';

const Movie = require('../../models/Movie.model');
const UserReaction = require('../../models/UserReaction.model');
const {
  listQualityWatchMovieIds: listQualityFromProgress,
} = require('./userMovieProgress.repository');
const { scoringWeights } = require('../config/scoringWeights');

/**
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [weights]
 * @returns {number}
 */
const qualityMinCompletion = (weights = scoringWeights) => {
  const n = weights.blend?.qualityMinCompletion;
  return typeof n === 'number' && !Number.isNaN(n) ? n : 0.3;
};

/**
 * Sifatli progress filtri (UserMovieProgress).
 * Production like → UserReaction (bu filterda liked yo‘q).
 *
 * @param {number} [minCompletion]
 * @returns {Object}
 */
const buildQualityWatchFilter = (minCompletion = qualityMinCompletion()) => ({
  completionRate: { $gt: minCompletion },
});

/**
 * @param {Array<string|number>} rawIds
 * @returns {number[]}
 */
const toNumericMovieIds = (rawIds) => {
  const out = [];
  const seen = new Set();
  for (const raw of rawIds || []) {
    const idStr = String(raw ?? '').trim();
    if (!idStr) continue;
    const num = Number(idStr);
    if (!Number.isInteger(num) || String(num) !== idStr) continue;
    if (seen.has(num)) continue;
    seen.add(num);
    out.push(num);
  }
  return out;
};

/**
 * Sifatli tomosha qilingan film id lari (DISTINCT) — UserMovieProgress.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} category
 * @param {number} minCompletion
 * @returns {Promise<string[]>}
 */
const listQualityWatchMovieIds = (userId, category, minCompletion) =>
  listQualityFromProgress(userId, category, minCompletion);

/**
 * User like qilgan filmlar shu category ichida (UserReaction → Movie).
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} category
 * @returns {Promise<string[]>}
 */
const listLikedMovieIdsInCategory = async (userId, category) => {
  const cat = String(category || '').trim();
  if (!userId || !cat) return [];

  const likes = await UserReaction.find({
    userId,
    type: 'movie',
    value: 'like',
  })
    .select({ targetId: 1, _id: 0 })
    .lean();

  const numericIds = toNumericMovieIds((likes || []).map((row) => row.targetId));
  if (!numericIds.length) return [];

  const movies = await Movie.find({
    id: { $in: numericIds },
    categoryName: cat,
  })
    .select({ id: 1, _id: 0 })
    .lean();

  return [...new Set((movies || []).map((m) => String(m.id)).filter(Boolean))];
};

/**
 * Unique film count for experience α (watch ∪ like — no double-count).
 *
 * @param {Array<string|number>} watchIds
 * @param {Array<string|number>} likeIds
 * @returns {number}
 */
const unionDistinctCount = (watchIds = [], likeIds = []) => {
  const set = new Set();
  for (const raw of [...(watchIds || []), ...(likeIds || [])]) {
    const id = String(raw ?? '').trim();
    if (id) set.add(id);
  }
  return set.size;
};

/**
 * userExperienceCount(userId, category)
 * = unique film soni (sifatli progress ∪ category like)
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} category
 * @param {Object} [opts]
 * @param {number} [opts.minCompletion]
 * @returns {Promise<number>}
 */
const getUserExperienceCount = async (userId, category, opts = {}) => {
  if (!userId) return 0;
  const cat = String(category || '').trim();
  if (!cat) return 0;

  const minCompletion =
    typeof opts.minCompletion === 'number'
      ? opts.minCompletion
      : qualityMinCompletion();

  const [watchIds, likeIds] = await Promise.all([
    listQualityWatchMovieIds(userId, cat, minCompletion),
    listLikedMovieIdsInCategory(userId, cat),
  ]);

  return unionDistinctCount(watchIds, likeIds);
};

/**
 * Bir nechta category uchun parallel hisob.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string[]} categories
 * @param {Object} [opts]
 * @returns {Promise<Map<string, number>>}
 */
const getUserExperienceCounts = async (userId, categories = [], opts = {}) => {
  /** @type {Map<string, number>} */
  const map = new Map();
  if (!userId || !Array.isArray(categories) || !categories.length) return map;

  const unique = [
    ...new Set(categories.map((c) => String(c || '').trim()).filter(Boolean)),
  ];

  await Promise.all(
    unique.map(async (category) => {
      const n = await getUserExperienceCount(userId, category, opts);
      map.set(category, n);
    })
  );

  return map;
};

module.exports = {
  qualityMinCompletion,
  buildQualityWatchFilter,
  unionDistinctCount,
  listQualityWatchMovieIds,
  listLikedMovieIdsInCategory,
  getUserExperienceCount,
  getUserExperienceCounts,
};
