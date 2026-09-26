/**
 * GET /api/music/mixes
 * userId cookie dan. Query dagi userId o'qilmaydi.
 * Faqat music_mixes. Bo'sh bo'lsa bo'sh ro'yxat.
 *
 * @module music-mixes/controllers/mix.controller
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { listReadyMixes } = require('../services/getMixes.service');

const getMixes = asyncHandler(async (req, res) => {
  const mixes = await listReadyMixes(req.authUser._id);
  return sendSuccess(res, { data: { mixes } });
});

module.exports = {
  getMixes,
};
