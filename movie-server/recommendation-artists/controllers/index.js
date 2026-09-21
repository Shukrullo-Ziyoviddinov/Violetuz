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
const { getTopArtists, getWeeklyTopArtists } = require('../services/topArtists.service');
const { getPopularArtists } = require('../services/popularArtistsRead.service');
const {
  getGuestRecommendedArtists,
} = require('../services/guestRecommendedArtists.service');
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
 * POST /api/recommended-artists/guest
 * Body: { localHistory: [{ m, ct, r, t }, ...], limit?, minScore? }
 * Auth YO‘Q. DB’ga yozilmaydi — localHistory → distinct artist scores.
 */
const postGuestRecommendedArtists = asyncHandler(async (req, res) => {
  const result = await getGuestRecommendedArtists({
    localHistory: req.body?.localHistory,
    limit: req.body?.limit ?? req.query?.limit,
    minScore: req.body?.minScore ?? req.query?.minScore,
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
 * GET /api/recommended-artists/top
 * Public Top-N artists leaderboard (default 10).
 */
const listTopArtists = asyncHandler(async (req, res) => {
  const result = await getTopArtists({
    limit: req.query?.limit,
    windowDays: req.query?.windowDays,
  });
  return sendSuccess(res, { data: result });
});

/**
 * GET /api/recommended-artists/weekly-top
 * Public weekly Top-N (rolling 7 days).
 */
const listWeeklyTopArtists = asyncHandler(async (req, res) => {
  const result = await getWeeklyTopArtists({
    limit: req.query?.limit,
    windowDays: req.query?.windowDays,
  });
  return sendSuccess(res, { data: result });
});

/**
 * GET /api/recommended-artists/popular
 * Public Mashhur artistlar (rolling 30 days, limit 20). Oyna configdan.
 */
const listPopularArtists = asyncHandler(async (req, res) => {
  const result = await getPopularArtists({
    limit: req.query?.limit,
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
      topLimit: scoringWeights.topLimit ?? 10,
      weeklyWindowDays: scoringWeights.weeklyWindowDays ?? 7,
    },
  });
});

module.exports = {
  listRecommendedArtists,
  postGuestRecommendedArtists,
  listTrendingArtists,
  listTopArtists,
  listWeeklyTopArtists,
  listPopularArtists,
  getConfig,
};
