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
 * @deprecated Trending uses watchEvent.averageWatchedSecondsByCategory (watchedAt window).
 * Thin alias for old callers.
 *
 * @param {Object} [opts]
 * @returns {Promise<Map<string, number>>}
 */
const averageWatchedSecondsByCategory = async (opts = {}) => {
  const {
    averageWatchedSecondsByCategory: fromWatchEvents,
  } = require('./watchEvent.repository');
  return fromWatchEvents(typeof opts === 'string' ? { category: opts } : opts);
};

/**
 * Sifatli tomosha (TTL-safe) — UserMovieProgress, not WatchEvent.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} category
 * @param {number} minCompletion
 * @returns {Promise<string[]>}
 */
const listQualityWatchMovieIds = async (userId, category, minCompletion) => {
  const cat = String(category || '').trim();
  if (!userId || !cat) return [];

  const min =
    typeof minCompletion === 'number' && !Number.isNaN(minCompletion)
      ? minCompletion
      : 0.3;

  const rows = await UserMovieProgress.find({
    userId,
    category: cat,
    completionRate: { $gt: min },
  })
    .select({ movieId: 1, _id: 0 })
    .lean();

  return [...new Set((rows || []).map((r) => String(r.movieId)).filter(Boolean))];
};

/**
 * Watched-penalty set (TTL-safe): durable progress that crossed the watch gate.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} category
 * @param {number} [limit=5000]
 * @returns {Promise<string[]>}
 */
const listWatchedMovieIds = async (userId, category, limit = 5000) => {
  const cat = String(category || '').trim();
  if (!userId || !cat) return [];

  const cfg = require('../config/scoringWeights').scoringWeights.progress || {};
  const minSec = cfg.minWatchedSeconds ?? 300;
  const shortRatio = cfg.shortFilmCompleteRatio ?? 0.8;

  const rows = await UserMovieProgress.find({
    userId,
    category: cat,
    $or: [
      { watchedSeconds: { $gte: minSec } },
      { completionRate: { $gte: shortRatio } },
    ],
  })
    .select({ movieId: 1, _id: 0 })
    .sort({ updatedAt: -1 })
    .limit(Math.max(1, limit))
    .lean();

  return [...new Set((rows || []).map((r) => String(r.movieId)).filter(Boolean))];
};

module.exports = {
  findProgress,
  upsertMaxProgress,
  markAffinityCompletion,
  averageWatchedSecondsByCategory,
  listQualityWatchMovieIds,
  listWatchedMovieIds,
};
