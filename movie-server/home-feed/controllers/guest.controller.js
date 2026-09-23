/**
 * POST /api/home-feed/guest
 *
 * @module home-feed/controllers/guest.controller
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { buildGuestHomeFeed } = require('../services/guestFeed.service');

const postGuestHomeFeed = asyncHandler(async (req, res) => {
  const result = await buildGuestHomeFeed({
    localHistory: req.body?.localHistory,
  });

  return sendSuccess(res, { data: result });
});

module.exports = {
  postGuestHomeFeed,
};
