/**
 * HTTP handlers for recommended-artists routes.
 *
 * @module recommendation-artists/controllers
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const {
  getRecommendedArtists,
  getTrendingArtists,
} = require('../services/artistWatchCount.service');
const { scoringWeights } = require('../config/scoringWeights');

/**
 * GET /api/recommended-artists
 */
const listRecommendedArtists = asyncHandler(async (req, res) => {
  const result = await getRecommendedArtists(req.authUser._id, {
    limit: req.query?.limit,
    minScore: req.query?.minScore,
  });

  return sendSuccess(res, { data: result });
});

/**
 * GET /api/recommended-artists/trending
 * Public global trending artists.
 */
const listTrendingArtists = asyncHandler(async (req, res) => {
  const result = await getTrendingArtists({
    limit: req.query?.limit,
    windowDays: req.query?.windowDays,
  });
  return sendSuccess(res, { data: result });
});

/**
 * GET /api/recommended-artists/config
 */
const getConfig = asyncHandler(async (_req, res) => {
  return sendSuccess(res, {
    data: {
      minContentCount: scoringWeights.minContentCount ?? 2,
      defaultLimit: scoringWeights.defaultLimit ?? 40,
    },
  });
});

module.exports = {
  listRecommendedArtists,
  listTrendingArtists,
  getConfig,
};
