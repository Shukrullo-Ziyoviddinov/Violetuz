/**
 * HTTP handlers for recommended-actors routes.
 *
 * @module recommendation-actors/controllers
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const {
  getRecommendedActors,
  getTrendingActors,
} = require('../services/actorWatchCount.service');
const { scoringWeights } = require('../config/scoringWeights');

/**
 * GET /api/recommended-actors
 * Auth required — personalized actor ids by distinct watched-movie count.
 */
const listRecommendedActors = asyncHandler(async (req, res) => {
  const result = await getRecommendedActors(req.authUser._id, {
    limit: req.query?.limit,
    minScore: req.query?.minScore,
  });

  return sendSuccess(res, { data: result });
});

/**
 * GET /api/recommended-actors/trending
 * Public global trending actor ids by recent credited movie passes.
 */
const listTrendingActors = asyncHandler(async (req, res) => {
  const result = await getTrendingActors({
    limit: req.query?.limit,
    windowDays: req.query?.windowDays,
  });

  return sendSuccess(res, { data: result });
});

/**
 * GET /api/recommended-actors/config
 * Public knobs for FE (no auth).
 */
const getConfig = asyncHandler(async (_req, res) => {
  return sendSuccess(res, {
    data: {
      minMovieCount: scoringWeights.minMovieCount ?? 2,
      defaultLimit: scoringWeights.defaultLimit ?? 40,
    },
  });
});

module.exports = {
  listRecommendedActors,
  listTrendingActors,
  getConfig,
};
