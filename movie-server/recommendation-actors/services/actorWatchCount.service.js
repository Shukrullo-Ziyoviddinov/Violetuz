/**
 * Recommended actors: +1 per distinct watched movie (progress gate elsewhere).
 * Uses shared entityDistinctCount core — no duplicated +1 logic.
 *
 * @module recommendation-actors/services/actorWatchCount.service
 */

'use strict';

const { service, store } = require('../store');
const { scoringWeights } = require('../config/scoringWeights');
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

/**
 * Global trending actors (public).
 * Score = number of credited user×movie passes (where actor appears),
 * summed across users within recency window.
 *
 * @param {{ limit?: number, windowDays?: number }} [opts]
 * @returns {Promise<{ actors: Array<{ actorId: string, score: number }>, limit: number, windowDays: number, source: string }>}
 */
const getTrendingActors = async (opts = {}) => {
  const defaultLimit = scoringWeights.defaultLimit ?? 40;
  const maxLimit = scoringWeights.maxLimit ?? 80;

  const limitRaw = Number(opts.limit);
  const limit = !Number.isFinite(limitRaw) || limitRaw <= 0 ? defaultLimit : limitRaw;
  const finalLimit = Math.min(maxLimit, Math.floor(limit));

  const windowDaysRaw = Number(opts.windowDays);
  const windowDays =
    !Number.isFinite(windowDaysRaw) || windowDaysRaw <= 0
      ? scoringWeights.trendingWindowDays ?? 30
      : windowDaysRaw;
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const CreditModel = store.CreditModel;

  const rows = await CreditModel.aggregate([
    { $match: { creditedAt: { $gte: since } } },
    { $unwind: '$actorIds' },
    { $group: { _id: '$actorIds', occurrences: { $sum: 1 } } },
    { $sort: { occurrences: -1, _id: 1 } },
    { $limit: finalLimit },
    { $project: { _id: 0, actorId: '$_id', score: '$occurrences' } },
  ]);

  const actors = (rows || []).map((r) => ({
    actorId: String(r.actorId),
    score: Number(r.score) || 0,
  }));

  return {
    actors,
    limit: finalLimit,
    windowDays,
    source: 'actor_watch_credits_trending',
  };
};

module.exports = {
  applyCreditsFromWatchedMovie,
  getRecommendedActors,
  getTrendingActors,
};
