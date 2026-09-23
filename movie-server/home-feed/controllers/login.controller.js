/**
 * GET /api/home-feed
 * userId cookie sessiyadan. Query dagi userId o'qilmaydi.
 *
 * @module home-feed/controllers/login.controller
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { getLoginHomeFeed } = require('../services/loginFeed.service');

const getLoginHomeFeedHandler = asyncHandler(async (req, res) => {
  const result = await getLoginHomeFeed(req.authUser._id);
  return sendSuccess(res, { data: result });
});

module.exports = {
  getLoginHomeFeedHandler,
};
