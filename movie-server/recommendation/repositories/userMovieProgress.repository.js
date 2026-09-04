/**
 * UserMovieProgress access — one row per user × movie (atomic MAX upsert).
 *
 * @module recommendation/repositories/userMovieProgress.repository
 */

'use strict';

const { UserMovieProgress } = require('../models');

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string|number} movieId
 * @returns {Promise<Object|null>}
 */
const findProgress = async (userId, movieId) =>
  UserMovieProgress.findOne({
    userId,
    movieId: String(movieId),
  }).lean();

/**
 * Atomic upsert: watchedSeconds / completionRate faqat oshganda yangilanadi ($max).
 *
 * @param {Object} input
 * @returns {Promise<{ progress: Object, previous: Object|null, raised: boolean }>}
 */
const upsertMaxProgress = async (input) => {
  const movieId = String(input.movieId);
  const category = String(input.category).trim();
  const watchedSeconds = Math.max(0, Number(input.watchedSeconds) || 0);
  const completionRate = Math.min(1, Math.max(0, Number(input.completionRate) || 0));
  const now = new Date();

  const previous = await findProgress(input.userId, movieId);

  const progress = await UserMovieProgress.findOneAndUpdate(
    { userId: input.userId, movieId },
    {
      $max: {
        watchedSeconds,
        completionRate,
      },
      $set: {
        category,
        updatedAt: now,
      },
      $setOnInsert: {
        userId: input.userId,
        movieId,
        lastAffinityCompletion: -1,
      },
    },
    { upsert: true, new: true, lean: true }
  );

  const raised =
    !previous ||
    (progress.watchedSeconds || 0) > (previous.watchedSeconds || 0) + 1e-6 ||
    (progress.completionRate || 0) > (previous.completionRate || 0) + 1e-6;

  return { progress, previous, raised: Boolean(raised) };
};

/**
 * Affinity muvaffaqiyatli yuborilgach — qayta bir xil completion uchun takrorlanmasin.
 */
const markAffinityCompletion = async (userId, movieId, completionRate) => {
  const rate = Math.min(1, Math.max(0, Number(completionRate) || 0));
  return UserMovieProgress.findOneAndUpdate(
    { userId, movieId: String(movieId) },
    {
      $max: { lastAffinityCompletion: rate },
      $set: { updatedAt: new Date() },
    },
    { new: true, lean: true }
  );
};

/**
 * Category × movieId bo‘yicha o‘rtacha watchedSeconds (trending avgWatchDuration).
 * views/likes bilan bir xil oyna: faqat since dan keyin yangilangan progress.
 *
 * @param {Object} [opts]
 * @param {string} [opts.category]
 * @param {Date|number} [opts.since] — bo‘lmasa all-time (faqat debug)
 * @returns {Promise<Map<string, number>>} key = `${category}\0${movieId}`
 */
const averageWatchedSecondsByCategory = async (opts = {}) => {
  /** @type {Object} */
  const match = {};

  const category =
    typeof opts === 'string' ? opts : opts && opts.category != null ? opts.category : null;
  if (category) match.category = String(category).trim();

  const sinceRaw = typeof opts === 'object' && opts ? opts.since : null;
  if (sinceRaw != null) {
    const since =
      sinceRaw instanceof Date
        ? sinceRaw
        : typeof sinceRaw === 'number'
          ? new Date(sinceRaw)
          : new Date(sinceRaw);
    if (!Number.isNaN(since.getTime())) {
      match.updatedAt = { $gte: since };
    }
  }

  const rows = await UserMovieProgress.aggregate([
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    {
      $group: {
        _id: { category: '$category', movieId: '$movieId' },
        avgWatchDuration: { $avg: '$watchedSeconds' },
      },
    },
  ]);

  /** @type {Map<string, number>} */
  const map = new Map();
  for (const row of rows) {
    const cat = row._id?.category;
    const movieId = row._id?.movieId;
    if (!cat || movieId == null) continue;
    map.set(`${cat}\0${movieId}`, Number(row.avgWatchDuration) || 0);
  }
  return map;
};

module.exports = {
  findProgress,
  upsertMaxProgress,
  markAffinityCompletion,
  averageWatchedSecondsByCategory,
};
