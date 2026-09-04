/**
 * HTTP handlers for recommendation routes.
 * @module recommendation/controllers
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { scoringWeights } = require('../config/scoringWeights');
const { getRecommendationsByCategory } = require('../services/serve.service');
const { reportMovieProgress } = require('../services/progress.service');

/**
 * GET /api/recommendations/config/progress
 * FE threshold sync (no auth — public knobs only).
 */
const getProgressConfig = asyncHandler(async (_req, res) => {
  const progress = scoringWeights.progress || {};
  return sendSuccess(res, {
    data: {
      minWatchedSeconds: progress.minWatchedSeconds ?? 300,
      shortFilmCompleteRatio: progress.shortFilmCompleteRatio ?? 0.8,
      affinityMinDelta: progress.affinityMinDelta ?? 0.1,
    },
  });
});

/**
 * GET /api/recommendations/:category?limit=
 * userId faqat auth session dan — query orqali boshqa user o‘qib bo‘lmaydi.
 */
const getByCategory = asyncHandler(async (req, res) => {
  const result = await getRecommendationsByCategory({
    userId: req.authUser._id,
    category: req.params.category,
    limit: req.query?.limit,
    hydrate: req.query?.hydrate !== 'false',
    lazy: req.query?.lazy,
  });

  return sendSuccess(res, { data: result });
});

/**
 * POST /api/recommendations/progress
 * Body: { movieId, watchedSeconds, completionRate?, durationSec? }
 * Min 5 daqiqa (yoki qisqa film ~80%) → ko'rildi + max progress upsert.
 */
const postProgress = asyncHandler(async (req, res) => {
  const result = await reportMovieProgress(req.authUser._id, {
    movieId: req.body?.movieId ?? req.body?.id,
    watchedSeconds: req.body?.watchedSeconds,
    completionRate: req.body?.completionRate,
    durationSec: req.body?.durationSec,
    category: req.body?.category,
  });

  return sendSuccess(res, { data: result }, result.firstMark ? 201 : 200);
});

module.exports = {
  getProgressConfig,
  getByCategory,
  postProgress,
};
