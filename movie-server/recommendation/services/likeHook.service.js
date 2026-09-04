/**
 * Fire-and-forget bridge: movie Like → affinity boost only.
 * Does NOT mark ContentView / "ko'rildi" and does NOT write WatchEvent.
 *
 * @module recommendation/services/likeHook.service
 */

'use strict';

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string|number} movieId
 */
const enqueueMovieLikeHook = (userId, movieId) => {
  if (!userId || movieId === undefined || movieId === null || movieId === '') {
    return { queued: false };
  }

  setImmediate(() => {
    Promise.resolve()
      .then(async () => {
        const { ensureJobsRegistered } = require('./watchEvent.service');
        const { findMovieProjectionById } = require('../repositories/movieProjection.repository');
        const { applyLikeToAffinities } = require('./affinity.service');
        const {
          enqueuePrecomputeRecommendations,
        } = require('../jobs/precomputeRecommendations.job');

        // First action may be Like (no prior watch) — register handlers before enqueue.
        ensureJobsRegistered();

        const movie = await findMovieProjectionById(movieId);
        if (!movie) return;

        const category = String(movie.categoryName || '').trim();
        if (!category) return;

        await applyLikeToAffinities({
          userId,
          movieId,
          category,
          movie,
        });

        enqueuePrecomputeRecommendations({ userId, category });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[recommendation] like hook failed:', err?.message || err);
      });
  });

  return { queued: true };
};

module.exports = {
  enqueueMovieLikeHook,
};
