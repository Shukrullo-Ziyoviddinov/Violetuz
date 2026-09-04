/**
 * Background job: refresh all affinity dimensions after a watch event.
 *
 * Job name: affinity:update
 * Payload: { watchEventId } | full watch fields + optional movie/snapshot
 *
 * @module recommendation/jobs/affinityUpdate.job
 */

'use strict';

const { recommendationQueue } = require('./inProcessQueue');
const { findWatchEventById } = require('../repositories/watchEvent.repository');
const { findMovieProjectionById } = require('../repositories/movieProjection.repository');
const { markAffinityCompletion } = require('../repositories/userMovieProgress.repository');
const { applyWatchToAffinities } = require('../services/affinity.service');
const { enqueuePrecomputeRecommendations } = require('./precomputeRecommendations.job');

const JOB_NAME = 'affinity:update';

/**
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
const handleAffinityUpdate = async (payload = {}) => {
  let watch = null;

  if (payload.watchEventId) {
    watch = await findWatchEventById(payload.watchEventId);
    if (!watch) {
      throw new Error(`WatchEvent not found: ${payload.watchEventId}`);
    }
  } else {
    watch = payload;
  }

  if (!watch.userId || !watch.movieId || !watch.category) {
    throw new Error('affinity:update requires userId, movieId, category');
  }

  let movie = payload.movie || null;
  if (!movie && !watch.dimensionSnapshot) {
    movie = await findMovieProjectionById(watch.movieId);
  }

  const affinityResult = await applyWatchToAffinities({
    userId: watch.userId,
    movieId: watch.movieId,
    category: watch.category,
    completionRate: watch.completionRate,
    liked: watch.liked,
    dimensionSnapshot: watch.dimensionSnapshot || payload.dimensionSnapshot || null,
    movie,
    watchEventId: watch._id || payload.watchEventId || null,
  });

  // Faqat affinity muvaffaqiyatidan keyin — fail bo‘lsa keyingi progress qayta urinadi.
  try {
    await markAffinityCompletion(
      watch.userId,
      watch.movieId,
      watch.completionRate ?? 0
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      '[recommendation] markAffinityCompletion failed:',
      err?.message || err
    );
  }

  // After affinity refresh, rebuild Top-N cache (async, non-blocking for HTTP)
  let precomputeQueued = false;
  if (payload.skipPrecompute !== true) {
    enqueuePrecomputeRecommendations({
      userId: watch.userId,
      category: watch.category,
    });
    precomputeQueued = true;
  }

  return {
    affinity: affinityResult,
    precomputeQueued,
  };
};

const registerAffinityUpdateJob = (queue = recommendationQueue) => {
  queue.register(JOB_NAME, handleAffinityUpdate);
  return JOB_NAME;
};

/**
 * Enqueue without awaiting (HTTP-safe).
 * @param {Object} payload
 * @param {import('./inProcessQueue').InProcessQueue} [queue]
 */
const enqueueAffinityUpdate = (payload, queue = recommendationQueue) =>
  queue.enqueue(JOB_NAME, payload);

module.exports = {
  JOB_NAME,
  handleAffinityUpdate,
  registerAffinityUpdateJob,
  enqueueAffinityUpdate,
};
