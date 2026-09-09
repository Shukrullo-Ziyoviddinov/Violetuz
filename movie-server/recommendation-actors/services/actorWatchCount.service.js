/**
 * Recommended actors: +1 per distinct watched movie (progress gate elsewhere).
 * Uses shared entityDistinctCount core — no duplicated +1 logic.
 *
 * @module recommendation-actors/services/actorWatchCount.service
 */

'use strict';

const { service } = require('../store');
const { toEntityIdList } = require('../../recommendation-shared/entityDistinctCount');

/**
 * @param {Object} input
 * @param {*} input.userId
 * @param {string|number} input.movieId
 * @param {unknown} input.actors
 */
const applyCreditsFromWatchedMovie = async (input = {}) => {
  const result = await service.applyCreditsFromItem({
    userId: input.userId,
    itemId: input.movieId,
    entityIds: toEntityIdList(input.actors),
  });
  return {
    applied: result.applied,
    actorCount: result.entityCount,
    reason: result.reason,
  };
};

/**
 * @param {*} userId
 * @param {{ limit?: number, minScore?: number }} [opts]
 */
const getRecommendedActors = (userId, opts = {}) =>
  service.listRecommended(userId, opts);

module.exports = {
  applyCreditsFromWatchedMovie,
  getRecommendedActors,
};
