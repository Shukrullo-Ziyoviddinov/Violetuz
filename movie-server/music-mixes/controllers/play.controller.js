/**
 * POST /api/music/mixes/play
 * userId cookie dan. Body dagi userId o'qilmaydi.
 * 80% yetmasa navbatga tushmaydi. Yetgan bo'lsa hisob navbatda, javob kutmaydi.
 *
 * @module music-mixes/controllers/play.controller
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { badRequest } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/response');
const { enqueueMixPlay } = require('../jobs/playEventQueue');
const { assessMixPlay } = require('../services/recordPlay.service');

const postMixPlay = asyncHandler(async (req, res) => {
  const contentId = String(req.body?.contentId ?? '').trim();
  const sessionId = String(req.body?.sessionId ?? '').trim();
  const listenedSeconds = Number(req.body?.listenedSeconds);
  const reportedDuration = Number(req.body?.durationSec);
  const durationSec = Number.isFinite(reportedDuration) && reportedDuration > 0 ? reportedDuration : null;

  if (!contentId || !sessionId || !Number.isFinite(listenedSeconds) || listenedSeconds < 0) {
    throw badRequest('contentId, sessionId va listenedSeconds kerak');
  }

  const assessed = await assessMixPlay({
    userId: req.authUser._id,
    contentId,
    listenedSeconds,
    sessionId,
    durationSec,
  });
  if (!assessed.accept) {
    return sendSuccess(res, {
      data: {
        queued: false,
        reason: assessed.reason,
        durationSec: assessed.durationSec,
      },
    });
  }

  enqueueMixPlay({
    userId: req.authUser._id,
    contentId,
    sessionId,
    listenedSeconds,
    durationSec: assessed.durationSec,
  });

  return sendSuccess(res, { data: { queued: true } });
});

module.exports = {
  postMixPlay,
};
