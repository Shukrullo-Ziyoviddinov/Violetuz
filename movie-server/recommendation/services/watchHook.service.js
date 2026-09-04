/**
 * Fire-and-forget bridge for internal watch → affinity (tests / jobs).
 * HTTP clients must use POST /recommendations/progress (threshold gated).
 * Do not call from ContentView /views — that bypasses the 5-minute gate.
 *
 * @module recommendation/services/watchHook.service
 */

'use strict';

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string|number} movieId
 * @param {Object} [extras]
 * @param {number} [extras.completionRate]
 * @param {boolean} [extras.liked]
 * @param {string} [extras.category]
 */
const enqueueMovieWatchHook = (userId, movieId, extras = {}) => {
  if (!userId || movieId === undefined || movieId === null || movieId === '') {
    return { queued: false };
  }

  setImmediate(() => {
    Promise.resolve()
      .then(() => {
        // Lazy require avoids circular load with routes/view
        const { recordWatchEvent } = require('./watchEvent.service');
        return recordWatchEvent({
          userId,
          movieId,
          completionRate: extras.completionRate ?? 0,
          liked: Boolean(extras.liked),
          category: extras.category,
        });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[recommendation] watch hook failed:', err?.message || err);
      });
  });

  return { queued: true };
};

module.exports = {
  enqueueMovieWatchHook,
};
