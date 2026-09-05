/**
 * Movie watch progress: min threshold → "ko'rildi", then keep MAX completion only.
 *
 * @module recommendation/services/progress.service
 */

'use strict';

const ContentView = require('../../models/ContentView.model');
const { scoringWeights } = require('../config/scoringWeights');
const { findMovieProjectionById } = require('../repositories/movieProjection.repository');
const {
  upsertMaxProgress,
} = require('../repositories/userMovieProgress.repository');
const { recordWatchEvent, ensureJobsRegistered } = require('./watchEvent.service');
const { badRequest, notFound } = require('../../utils/errors');

const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0));

/**
 * @param {number} watchedSeconds
 * @param {number} completionRate
 * @param {number} [durationSec]
 * @returns {boolean}
 */
const isEligibleProgress = (watchedSeconds, completionRate, durationSec) => {
  const cfg = scoringWeights.progress || {};
  const minSec = cfg.minWatchedSeconds ?? 300;
  const shortRatio = cfg.shortFilmCompleteRatio ?? 0.8;

  if (watchedSeconds >= minSec) return true;

  if (
    Number.isFinite(durationSec) &&
    durationSec > 0 &&
    durationSec < minSec &&
    (watchedSeconds >= durationSec * shortRatio || completionRate >= shortRatio)
  ) {
    return true;
  }

  return false;
};

/**
 * ContentView — "ko'rildi" (recommendation hook yo'q; affinity alohida).
 */
const ensureContentViewMarked = async (userId, movieId) => {
  try {
    await ContentView.create({
      userId,
      type: 'movie',
      itemId: String(movieId),
    });
    return true;
  } catch (err) {
    if (err?.code === 11000) return false;
    throw err;
  }
};

/**
 * Progress report from WatchModal.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {Object} input
 * @param {string|number} input.movieId
 * @param {number} input.watchedSeconds
 * @param {number} [input.completionRate]
 * @param {number} [input.durationSec]
 * @param {string} [input.category]
 */
const reportMovieProgress = async (userId, input = {}) => {
  ensureJobsRegistered();

  if (!userId) throw badRequest('userId majburiy');
  const movieId = input.movieId ?? input.id;
  if (movieId === undefined || movieId === null || movieId === '') {
    throw badRequest('movieId majburiy');
  }

  const watchedSeconds = Math.max(0, Number(input.watchedSeconds) || 0);
  let completionRate = clamp01(input.completionRate);
  const durationSec =
    typeof input.durationSec === 'number' && Number.isFinite(input.durationSec)
      ? Math.max(0, input.durationSec)
      : null;

  if (
    durationSec &&
    durationSec > 0 &&
    (!input.completionRate || !Number.isFinite(Number(input.completionRate)))
  ) {
    completionRate = clamp01(watchedSeconds / durationSec);
  }

  if (!isEligibleProgress(watchedSeconds, completionRate, durationSec)) {
    return {
      ignored: true,
      reason: 'below_threshold',
      watchedSeconds,
      completionRate,
    };
  }

  const movie = await findMovieProjectionById(movieId);
  if (!movie) throw notFound(`Movie not found: ${movieId}`);

  const category = String(input.category || movie.categoryName || '').trim();
  if (!category) throw badRequest('category (categoryName) majburiy');

  const { progress, previous, raised } = await upsertMaxProgress({
    userId,
    movieId,
    category,
    watchedSeconds,
    completionRate,
  });

  const cfg = scoringWeights.progress || {};
  const minDelta = cfg.affinityMinDelta ?? 0.1;
  const lastAffinity = typeof progress.lastAffinityCompletion === 'number'
    ? progress.lastAffinityCompletion
    : -1;
  const needsAffinity =
    lastAffinity < 0 || progress.completionRate - lastAffinity >= minDelta - 1e-9;

  // Progress o'zgarmagan va affinity ham kerak emas
  if (!raised && !needsAffinity) {
    return {
      ignored: false,
      updated: false,
      progress,
      firstMark: false,
      affinityQueued: false,
    };
  }

  let affinityQueued = false;
  let firstMark = false;

  if (needsAffinity) {
    const contentCreated = await ensureContentViewMarked(userId, movieId);
    firstMark = contentCreated || lastAffinity < 0;

    // lastAffinityCompletion affinity:update muvaffaqiyatidan keyin yoziladi (job).
    await recordWatchEvent({
      userId,
      movieId,
      category,
      completionRate: progress.completionRate,
      watchedSeconds: progress.watchedSeconds,
    });
    affinityQueued = true;
  }

  return {
    ignored: false,
    updated: raised || affinityQueued,
    firstMark,
    affinityQueued,
    progress: {
      movieId: progress.movieId,
      category: progress.category,
      watchedSeconds: progress.watchedSeconds,
      completionRate: progress.completionRate,
      updatedAt: progress.updatedAt,
    },
  };
};

module.exports = {
  isEligibleProgress,
  reportMovieProgress,
};
