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

module.exports = {
  findProgress,
  upsertMaxProgress,
  markAffinityCompletion,
};
