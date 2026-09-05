/**
 * WatchEvent persistence.
 *
 * @module recommendation/repositories/watchEvent.repository
 */

'use strict';

const { WatchEvent } = require('../models');

/**
 * @param {Object} payload
 * @param {string|import('mongoose').Types.ObjectId} payload.userId
 * @param {string|number} payload.movieId
 * @param {string} payload.category
 * @param {number} [payload.completionRate]
 * @param {number} [payload.watchedSeconds]
 * @param {boolean} [payload.liked]
 * @param {Date} [payload.watchedAt]
 * @param {Object|null} [payload.dimensionSnapshot]
 * @returns {Promise<Object>}
 */
const createWatchEvent = async (payload) => {
  const doc = await WatchEvent.create({
    userId: payload.userId,
    movieId: String(payload.movieId),
    category: String(payload.category).trim(),
    completionRate: payload.completionRate ?? 0,
    watchedSeconds: Math.max(0, Number(payload.watchedSeconds) || 0),
    liked: Boolean(payload.liked),
    watchedAt: payload.watchedAt || new Date(),
    dimensionSnapshot: payload.dimensionSnapshot || null,
  });
  return doc.toObject();
};

/**
 * Prior watches of the same movie by this user (for duplicate boost cap).
 * Excludes the current event when excludeId is passed.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string|number} movieId
 * @param {string|import('mongoose').Types.ObjectId} [excludeId]
 * @returns {Promise<number>}
 */
const countPriorWatches = async (userId, movieId, excludeId) => {
  const filter = {
    userId,
    movieId: String(movieId),
  };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  return WatchEvent.countDocuments(filter);
};

/**
 * @param {string|import('mongoose').Types.ObjectId} id
 * @returns {Promise<Object|null>}
 */
const findWatchEventById = async (id) => WatchEvent.findById(id).lean();

/**
 * Recently watched movie ids — DEPRECATED for scoring penalty.
 * Prefer userMovieProgress.listWatchedMovieIds (TTL-safe).
 * Kept for affinity rewatch counts / diagnostics.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} category
 * @param {number} [limit=200]
 * @returns {Promise<string[]>}
 */
const listWatchedMovieIds = async (userId, category, limit = 200) => {
  const rows = await WatchEvent.find({
    userId,
    category: String(category).trim(),
  })
    .select({ movieId: 1, _id: 0 })
    .sort({ watchedAt: -1 })
    .limit(limit)
    .lean();

  return [...new Set(rows.map((r) => String(r.movieId)))];
};

/**
 * Average watchedSeconds per category×movie — same calendar window + decay as views.
 * weight = 0.5 ^ (ageDays / halfLife); avg = Σ(sec×w) / Σ(w)
 *
 * @param {Object} [opts]
 * @param {string} [opts.category]
 * @param {Date|number} [opts.since]
 * @param {Date|number} [opts.now]
 * @param {number} [opts.halfLifeDays]
 * @returns {Promise<Map<string, number>>} key = `${category}\0${movieId}`
 */
const averageWatchedSecondsByCategory = async (opts = {}) => {
  const nowMs =
    opts.now instanceof Date
      ? opts.now.getTime()
      : typeof opts.now === 'number'
        ? opts.now
        : Date.now();
  const now = new Date(nowMs);
  const since =
    opts.since instanceof Date
      ? opts.since
      : typeof opts.since === 'number'
        ? new Date(opts.since)
        : new Date(nowMs - 30 * 86_400_000);
  const halfLifeDays = Math.max(1, Number(opts.halfLifeDays) || 15);
  const msPerDay = 86_400_000;

  /** @type {Object} */
  const match = {
    watchedAt: { $gte: since, $lte: now },
    watchedSeconds: { $gt: 0 },
  };

  const category =
    typeof opts.category === 'string' ? opts.category.trim() : '';
  if (category) match.category = category;

  const rows = await WatchEvent.aggregate([
    { $match: match },
    {
      $addFields: {
        weight: {
          $pow: [
            0.5,
            {
              $divide: [
                {
                  $divide: [{ $subtract: [now, '$watchedAt'] }, msPerDay],
                },
                halfLifeDays,
              ],
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: { category: '$category', movieId: '$movieId' },
        weightedSum: { $sum: { $multiply: ['$watchedSeconds', '$weight'] } },
        weightSum: { $sum: '$weight' },
      },
    },
  ]);

  /** @type {Map<string, number>} */
  const map = new Map();
  for (const row of rows) {
    const cat = row._id?.category;
    const movieId = row._id?.movieId;
    if (!cat || movieId == null) continue;
    const w = Number(row.weightSum) || 0;
    const avg = w > 0 ? Number(row.weightedSum) / w : 0;
    map.set(`${cat}\0${movieId}`, avg);
  }
  return map;
};

/**
 * Aggregate watch_events in a time window with recency decay weights.
 * ALL signals use the same decay weight (views / likes / completion / duration):
 *   weight = 0.5 ^ (ageDays / halfLifeDays)
 *   viewCountRecent     = Σ weight
 *   likeCount           = Σ weight where liked
 *   completionRateAvg   = Σ (completion × weight) / Σ weight
 *   (avgWatchDuration is separate helper — same weight formula)
 *
 * @param {Object} [opts]
 * @param {Date|number} [opts.since]
 * @param {Date|number} [opts.now]
 * @param {number} [opts.halfLifeDays] — exponential decay half-life
 * @returns {Promise<Array<{ category: string, movieId: string, viewCountRecent: number, likeCount: number, completionRateAvg: number }>>}
 */
const aggregateWatchStatsByCategory = async (opts = {}) => {
  const nowMs =
    opts.now instanceof Date
      ? opts.now.getTime()
      : typeof opts.now === 'number'
        ? opts.now
        : Date.now();
  const now = new Date(nowMs);
  const since =
    opts.since instanceof Date
      ? opts.since
      : typeof opts.since === 'number'
        ? new Date(opts.since)
        : new Date(nowMs - 30 * 86_400_000);
  const halfLifeDays = Math.max(1, Number(opts.halfLifeDays) || 15);
  const msPerDay = 86_400_000;

  const rows = await WatchEvent.aggregate([
    {
      $match: {
        watchedAt: { $gte: since, $lte: now },
      },
    },
    {
      $addFields: {
        weight: {
          $pow: [
            0.5,
            {
              $divide: [
                {
                  $divide: [{ $subtract: [now, '$watchedAt'] }, msPerDay],
                },
                halfLifeDays,
              ],
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: { category: '$category', movieId: '$movieId' },
        viewCountRecent: { $sum: '$weight' },
        likeCount: {
          $sum: {
            $cond: [{ $eq: ['$liked', true] }, '$weight', 0],
          },
        },
        completionWeightSum: {
          $sum: { $multiply: ['$completionRate', '$weight'] },
        },
        weightSum: { $sum: '$weight' },
      },
    },
    {
      $project: {
        _id: 0,
        category: '$_id.category',
        movieId: '$_id.movieId',
        viewCountRecent: 1,
        likeCount: 1,
        completionRateAvg: {
          $cond: [
            { $gt: ['$weightSum', 0] },
            { $divide: ['$completionWeightSum', '$weightSum'] },
            0,
          ],
        },
      },
    },
  ]);

  return rows;
};

module.exports = {
  createWatchEvent,
  countPriorWatches,
  findWatchEventById,
  listWatchedMovieIds,
  aggregateWatchStatsByCategory,
  averageWatchedSecondsByCategory,
};
