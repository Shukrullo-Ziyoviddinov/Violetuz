/**
 * Clip/concert unlike / dislike → reverse likedBoost.
 *
 * @module recommendation-music/services/unlikeHook.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { normalizeContentType } = require('../utils/contentKey');

/**
 * @param {*} userId
 * @param {string} contentType
 * @param {string|number} contentId
 */
const enqueueMusicUnlikeHook = (userId, contentType, contentId) => {
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
        const { applyUnlikeToAffinities } = require('./affinity.service');
        const {
          enqueuePrecomputeRecommendations,
        } = require('../jobs/precomputeRecommendations.job');

        ensureJobsRegistered();

        const content = await findContentProjection(type, contentId);
        if (!content) return;

        const category = String(content.categoryNameMusic || '').trim();
        if (!category) return;

        await applyUnlikeToAffinities({
          userId,
          contentType: type,
          contentId,
          category,
          content,
        });

        enqueuePrecomputeRecommendations({ userId, category, contentType: type });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[recommendation-music] unlike hook failed:', err?.message || err);
      });
  });

  return { queued: true };
};

module.exports = {
  enqueueMusicUnlikeHook,
};
