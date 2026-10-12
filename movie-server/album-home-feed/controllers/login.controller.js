/**
 * GET /api/album-home-feed
 * userId cookie sessiyadan. Query dagi userId o'qilmaydi.
 *
 * @module album-home-feed/controllers/login.controller
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { getLoginAlbumFeed } = require('../services/loginFeed.service');

const getLoginAlbumFeedHandler = asyncHandler(async (req, res) => {
  const result = await getLoginAlbumFeed(req.authUser._id);
  return sendSuccess(res, { data: result });
});

module.exports = {
  getLoginAlbumFeedHandler,
};
