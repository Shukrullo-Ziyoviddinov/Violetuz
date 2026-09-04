/**
 * Record a watch event quickly, then queue affinity refresh in the background.
 *
 * @module recommendation/services/watchEvent.service
 */

'use strict';

const { extractAllDimensionValues } = require('../dimensions');
const { findMovieProjectionById } = require('../repositories/movieProjection.repository');
const { createWatchEvent } = require('../repositories/watchEvent.repository');
const {
  registerAffinityUpdateJob,
  enqueueAffinityUpdate,
  JOB_NAME,
} = require('../jobs/affinityUpdate.job');
const { registerPrecomputeRecommendationsJob } = require('../jobs/precomputeRecommendations.job');
const { recommendationQueue } = require('../jobs/inProcessQueue');

let jobsRegistered = false;

const ensureJobsRegistered = () => {
  if (!jobsRegistered) {
    registerAffinityUpdateJob(recommendationQueue);
    registerPrecomputeRecommendationsJob(recommendationQueue);
    jobsRegistered = true;
  }
};

/**
 * Persist watch + enqueue affinity:update (non-blocking).
 *
 * @param {Object} input
 * @param {string|import('mongoose').Types.ObjectId} input.userId
 * @param {string|number} input.movieId
 * @param {number} [input.completionRate]
 * @param {boolean} [input.liked]
 * @param {string} [input.category] — defaults to movie.categoryName
 * @param {boolean} [input.waitForAffinity=false] — tests only
 * @returns {Promise<{ watchEvent: Object, queued: boolean, jobName: string, affinityResult?: Object }>}
 */
const recordWatchEvent = async (input) => {
  ensureJobsRegistered();

  const userId = input.userId;
  const movieId = input.movieId;

  if (!userId) {
    const err = new Error('userId is required');
    err.status = 400;
    throw err;
  }
  if (movieId === undefined || movieId === null || movieId === '') {
    const err = new Error('movieId is required');
    err.status = 400;
    throw err;
  }

  const movie = await findMovieProjectionById(movieId);
  if (!movie) {
    const err = new Error(`Movie not found: ${movieId}`);
    err.status = 404;
    throw err;
  }

  const category = String(input.category || movie.categoryName || '').trim();
  if (!category) {
    const err = new Error('category (categoryName) is required');
    err.status = 400;
    throw err;
  }

  const dimensionSnapshot = extractAllDimensionValues(movie);

  const watchEvent = await createWatchEvent({
    userId,
    movieId,
    category,
    completionRate: input.completionRate ?? 0,
    liked: Boolean(input.liked),
    watchedAt: input.watchedAt || new Date(),
    dimensionSnapshot,
  });

  const jobPayload = {
    watchEventId: watchEvent._id,
    // Pass snapshot so the worker usually skips a second movie fetch
    dimensionSnapshot,
    movie,
  };

  if (input.waitForAffinity) {
    const affinityResult = await recommendationQueue.enqueueAndWait(JOB_NAME, jobPayload);
    return {
      watchEvent,
      queued: false,
      jobName: JOB_NAME,
      affinityResult,
    };
  }

  enqueueAffinityUpdate(jobPayload);

  return {
    watchEvent,
    queued: true,
    jobName: JOB_NAME,
  };
};

module.exports = {
  recordWatchEvent,
  ensureJobsRegistered,
};
