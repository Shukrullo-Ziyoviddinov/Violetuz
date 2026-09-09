/**
 * Recommended artists: +1 per distinct listened content (music progress gate).
 * Uses shared entityDistinctCount — not a copy of actors module.
 *
 * @module recommendation-artists/services/artistWatchCount.service
 */

'use strict';

const { service } = require('../store');
const { toEntityIdList } = require('../../recommendation-shared/entityDistinctCount');

/**
 * After content crosses "tinglandi" (≥10s): +1 for content.artistId once.
 *
 * @param {Object} input
 * @param {*} input.userId
 * @param {string} input.contentKey — e.g. music:12 / clip:3
 * @param {unknown} input.artistId — single id (music/clip/concert/album)
 */
const applyCreditsFromListenedContent = async (input = {}) => {
  const result = await service.applyCreditsFromItem({
    userId: input.userId,
    itemId: input.contentKey,
    entityIds: toEntityIdList(input.artistId),
  });
  return {
    applied: result.applied,
    artistCount: result.entityCount,
    reason: result.reason,
  };
};

/**
 * @param {*} userId
 * @param {{ limit?: number, minScore?: number }} [opts]
 */
const getRecommendedArtists = (userId, opts = {}) =>
  service.listRecommended(userId, opts);

module.exports = {
  applyCreditsFromListenedContent,
  getRecommendedArtists,
};
