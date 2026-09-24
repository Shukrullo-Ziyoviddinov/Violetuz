/**
 * POST /api/music-home-feed/guest
 *
 * @module music-home-feed/controllers/guest.controller
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { buildGuestMusicFeed } = require('../services/guestFeed.service');

const postGuestMusicFeed = asyncHandler(async (req, res) => {
  const result = await buildGuestMusicFeed({
    localHistory: req.body?.localHistory,
  });

  return sendSuccess(res, { data: result });
});

module.exports = {
  postGuestMusicFeed,
};
