/**
 * Recommended artists: +1 per distinct listened content (music progress gate).
 * Uses shared entityDistinctCount — not a copy of actors module.
 *
 * @module recommendation-artists/services/artistWatchCount.service
 */

'use strict';

const { service, store } = require('../store');
const { scoringWeights } = require('../config/scoringWeights');
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

/**
 * Global trending artists (public).
 * Score = number of credited user×content passes where artist appears,
 * summed across users within recency window.
 *
 * @param {{ limit?: number, windowDays?: number }} [opts]
 * @returns {Promise<{ artists: Array<{ artistId: string, score: number }>, limit: number, windowDays: number, source: string }>}
 */
const getTrendingArtists = async (opts = {}) => {
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
    { $unwind: '$artistIds' },
    { $group: { _id: '$artistIds', occurrences: { $sum: 1 } } },
    { $sort: { occurrences: -1, _id: 1 } },
    { $limit: finalLimit },
    { $project: { _id: 0, artistId: '$_id', score: '$occurrences' } },
  ]);

  const artists = (rows || []).map((r) => ({
    artistId: String(r.artistId),
    score: Number(r.score) || 0,
  }));

  return {
    artists,
    limit: finalLimit,
    windowDays,
    source: 'artist_watch_credits_trending',
  };
};

module.exports = {
  applyCreditsFromListenedContent,
  getRecommendedArtists,
  getTrendingArtists,
};
