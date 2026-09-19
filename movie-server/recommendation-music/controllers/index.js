/**
 * HTTP handlers for music recommendation routes.
 *
 * @module recommendation-music/controllers
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { scoringWeights } = require('../config/scoringWeights');
const { getRecommendationsByCategory } = require('../services/serve.service');
const { reportMusicProgress } = require('../services/progress.service');
const {
  getGuestRecommendationsByCategory,
} = require('../services/guestRecommendations.service');
const {
  getWeeklyTopMusicFromListenEvents,
} = require('../services/weeklyTopMusicRead.service');
const {
  getMonthlyTopMusicFromListenEvents,
} = require('../services/monthlyTopMusicRead.service');
const {
  getTopMusicChartsFromListenEvents,
} = require('../services/topMusicChartsRead.service');

/**
 * GET /api/music-recommendations/config/progress
 */
const getProgressConfig = asyncHandler(async (_req, res) => {
  const progress = scoringWeights.progress || {};
  return sendSuccess(res, {
    data: {
      minListenedSeconds: progress.minListenedSeconds ?? 10,
      shortCompleteRatio: progress.shortCompleteRatio ?? 0.8,
      affinityMinDelta: progress.affinityMinDelta ?? 0.1,
      likeEnabledTypes: [...(scoringWeights.likeEnabledTypes || [])],
    },
  });
});

/**
 * GET /api/music-recommendations/weekly-top
 * Public. Faqat ListenEvent o‘qiydi — progress/affinity yozilmaydi.
 */
const getWeeklyTopMusic = asyncHandler(async (req, res) => {
  const result = await getWeeklyTopMusicFromListenEvents({
    limit: req.query?.limit,
  });

  return sendSuccess(res, { data: result });
});

/**
 * GET /api/music-recommendations/monthly-top
 * Public. Hafta bilan bir xil ranker, oyna 30 kun. Yozuv yo‘q.
 */
const getMonthlyTopMusic = asyncHandler(async (req, res) => {
  const result = await getMonthlyTopMusicFromListenEvents({
    limit: req.query?.limit,
  });

  return sendSuccess(res, { data: result });
});

/**
 * GET /api/music-recommendations/top-charts
 * Public. Hafta + oy bir so‘rovda (parallel compose). Yozuv yo‘q.
 */
const getTopMusicCharts = asyncHandler(async (req, res) => {
  const result = await getTopMusicChartsFromListenEvents({
    limit: req.query?.limit,
  });

  return sendSuccess(res, { data: result });
});

/**
 * GET /api/music-recommendations/:categoryNameMusic?limit=&lazy=&contentType=
 */
const getByCategory = asyncHandler(async (req, res) => {
  const result = await getRecommendationsByCategory({
    userId: req.authUser._id,
    category: req.params.categoryNameMusic,
    contentType: req.query?.contentType ?? req.query?.type,
    limit: req.query?.limit,
    hydrate: req.query?.hydrate !== 'false',
    lazy: req.query?.lazy,
  });

  return sendSuccess(res, { data: result });
});

/**
 * POST /api/music-recommendations/:categoryNameMusic/guest
 * Body: { localHistory: [{ m, c, ct, r, t }], contentType?, limit?, hydrate? }
 * Auth YO‘Q. DB yozuv yo‘q.
 */
const postGuestByCategory = asyncHandler(async (req, res) => {
  const result = await getGuestRecommendationsByCategory({
    category: req.params.categoryNameMusic,
    contentType:
      req.body?.contentType ?? req.query?.contentType ?? req.query?.type,
    localHistory: req.body?.localHistory,
    limit: req.body?.limit ?? req.query?.limit,
    hydrate: req.body?.hydrate !== false && req.query?.hydrate !== 'false',
  });

  return sendSuccess(res, { data: result });
});

/**
 * POST /api/music-recommendations/progress
 */
const postProgress = asyncHandler(async (req, res) => {
  const result = await reportMusicProgress(req.authUser._id, {
    contentType: req.body?.contentType ?? req.body?.type,
    contentId: req.body?.contentId ?? req.body?.id,
    listenedSeconds: req.body?.listenedSeconds ?? req.body?.watchedSeconds,
    completionRate: req.body?.completionRate,
    durationSec: req.body?.durationSec,
    category: req.body?.category ?? req.body?.categoryNameMusic,
    trackId: req.body?.trackId ?? req.body?.albumSongId ?? req.body?.songId,
    trackListenedSeconds: req.body?.trackListenedSeconds,
    albumDurationSec: req.body?.albumDurationSec,
  });

  return sendSuccess(res, { data: result }, result.firstMark ? 201 : 200);
});

module.exports = {
  getProgressConfig,
  getWeeklyTopMusic,
  getMonthlyTopMusic,
  getTopMusicCharts,
  getByCategory,
  postGuestByCategory,
  postProgress,
};
