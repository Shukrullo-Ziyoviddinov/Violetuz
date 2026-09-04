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
 * Recently watched movie ids for a user in a category (penalty set).
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
 * Aggregate watch_events in a time window with recency decay weights.
 * Returns one row per (category, movieId).
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
        completionRateAvg: { $avg: '$completionRate' },
      },
    },
    {
      $project: {
        _id: 0,
        category: '$_id.category',
        movieId: '$_id.movieId',
        viewCountRecent: 1,
        likeCount: 1,
        completionRateAvg: { $ifNull: ['$completionRateAvg', 0] },
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
};
