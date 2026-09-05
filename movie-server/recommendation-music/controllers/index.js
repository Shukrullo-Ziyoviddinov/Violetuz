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
 * GET /api/music-recommendations/:categoryNameMusic?limit=&lazy=
 */
const getByCategory = asyncHandler(async (req, res) => {
  const result = await getRecommendationsByCategory({
    userId: req.authUser._id,
    category: req.params.categoryNameMusic,
    limit: req.query?.limit,
    hydrate: req.query?.hydrate !== 'false',
    lazy: req.query?.lazy,
  });

  return sendSuccess(res, { data: result });
});

/**
 * POST /api/music-recommendations/progress
 * Body: { contentType, contentId, listenedSeconds, completionRate?, durationSec?, category? }
 */
/**
 * POST /api/music-recommendations/progress
 * Body:
 *   music|clip|concert: { contentType, contentId, listenedSeconds, durationSec?, category? }
 *   album: + { trackId, trackListenedSeconds?, albumDurationSec? }
 *
 * Gate ≥10s; affinity strength = completionRate (0..1).
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
  getByCategory,
  postProgress,
};
