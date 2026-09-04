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

module.exports = {
  createWatchEvent,
  countPriorWatches,
  findWatchEventById,
  listWatchedMovieIds,
};
