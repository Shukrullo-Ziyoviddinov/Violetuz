/**
 * Clip/concert Like → music affinity boost only (music/album skipped).
 *
 * @module recommendation-music/services/likeHook.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { normalizeContentType } = require('../utils/contentKey');

/**
 * @param {*} userId
 * @param {string} contentType — clip | concert
 * @param {string|number} contentId
 */
const enqueueMusicLikeHook = (userId, contentType, contentId) => {
  const type = normalizeContentType(contentType);
  if (
    !userId ||
    contentId === undefined ||
    contentId === null ||
    contentId === '' ||
    !scoringWeights.likeEnabledTypes.includes(type)
  ) {
    return { queued: false };
  }

  setImmediate(() => {
    Promise.resolve()
      .then(async () => {
        const { ensureJobsRegistered } = require('./listenEvent.service');
        const { findContentProjection } = require('../repositories/contentProjection.repository');
        const { applyLikeToAffinities } = require('./affinity.service');
        const {
          enqueuePrecomputeRecommendations,
        } = require('../jobs/precomputeRecommendations.job');

        ensureJobsRegistered();

        const content = await findContentProjection(type, contentId);
        if (!content) return;

        const category = String(content.categoryNameMusic || '').trim();
        if (!category) return;

        await applyLikeToAffinities({
          userId,
          contentType: type,
          contentId,
          category,
          content,
        });

        enqueuePrecomputeRecommendations({ userId, category });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[recommendation-music] like hook failed:', err?.message || err);
      });
  });

  return { queued: true };
};

module.exports = {
  enqueueMusicLikeHook,
};
