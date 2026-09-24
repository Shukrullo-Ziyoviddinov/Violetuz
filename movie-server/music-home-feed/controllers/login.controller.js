/**
 * GET /api/music-home-feed
 * userId cookie sessiyadan. Query dagi userId o'qilmaydi.
 *
 * @module music-home-feed/controllers/login.controller
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { getLoginMusicFeed } = require('../services/loginFeed.service');

const getLoginMusicFeedHandler = asyncHandler(async (req, res) => {
  const result = await getLoginMusicFeed(req.authUser._id);
  return sendSuccess(res, { data: result });
});

module.exports = {
  getLoginMusicFeedHandler,
};
