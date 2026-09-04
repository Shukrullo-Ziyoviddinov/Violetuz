/**
 * Fire-and-forget: movie Like removed / dislike → reverse likedBoost.
 * Does NOT touch ContentView / WatchEvent.
 *
 * @module recommendation/services/unlikeHook.service
 */

'use strict';

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string|number} movieId
 */
const enqueueMovieUnlikeHook = (userId, movieId) => {
  if (!userId || movieId === undefined || movieId === null || movieId === '') {
    return { queued: false };
  }

  setImmediate(() => {
    Promise.resolve()
      .then(async () => {
        const { ensureJobsRegistered } = require('./watchEvent.service');
        const { findMovieProjectionById } = require('../repositories/movieProjection.repository');
        const { applyUnlikeToAffinities } = require('./affinity.service');
        const {
          enqueuePrecomputeRecommendations,
        } = require('../jobs/precomputeRecommendations.job');

        ensureJobsRegistered();

        const movie = await findMovieProjectionById(movieId);
        if (!movie) return;

        const category = String(movie.categoryName || '').trim();
        if (!category) return;

        await applyUnlikeToAffinities({
          userId,
          movieId,
          category,
          movie,
        });

        enqueuePrecomputeRecommendations({ userId, category });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[recommendation] unlike hook failed:', err?.message || err);
      });
  });

  return { queued: true };
};

module.exports = {
  enqueueMovieUnlikeHook,
};
