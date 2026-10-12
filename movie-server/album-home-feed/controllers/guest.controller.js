/**
 * POST /api/album-home-feed/guest
 * Bazaga yozilmaydi.
 *
 * @module album-home-feed/controllers/guest.controller
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { buildGuestAlbumFeed } = require('../services/guestFeed.service');

const postGuestAlbumFeed = asyncHandler(async (req, res) => {
  const result = await buildGuestAlbumFeed({
    localHistory: req.body?.localHistory,
  });

  return sendSuccess(res, { data: result });
});

module.exports = {
  postGuestAlbumFeed,
};
