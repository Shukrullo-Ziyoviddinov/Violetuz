/**
 * Parda ortida foizi. Faqat hisob. Mehmon yozuvi yo‘q.
 *
 * @module recommendation-triller/controllers
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const {
  reportTrillerProgress,
  listTrillerProgress,
} = require('../services/progress.service');

const postProgress = asyncHandler(async (req, res) => {
  const result = await reportTrillerProgress(req.authUser._id, req.body || {});
  return sendSuccess(res, { data: result });
});

const getProgress = asyncHandler(async (req, res) => {
  const result = await listTrillerProgress(req.authUser._id);
  return sendSuccess(res, { data: result });
});

module.exports = {
  postProgress,
  getProgress,
};
