/**
 * POST /api/home-feed/guest
 *
 * @module home-feed/controllers/guest.controller
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { buildGuestHomeFeed, buildGuestHomeFeedPage } = require('../services/guestFeed.service');

const postGuestHomeFeed = asyncHandler(async (req, res) => {
  const limitRaw = req.body?.limit;
  const paged = limitRaw != null && limitRaw !== '';
  const excludeRaw = req.body?.exclude;
  const excludeIds = Array.isArray(excludeRaw)
    ? excludeRaw
    : String(excludeRaw || '').split(',');
  const genre = String(req.body?.genre || '').trim();
  const result = paged
    ? await buildGuestHomeFeedPage({
      localHistory: req.body?.localHistory,
      offset: req.body?.offset,
      limit: limitRaw,
      excludeIds: excludeIds.map((id) => String(id).trim()).filter(Boolean),
      genre: genre === 'all' ? '' : genre,
    })
    : await buildGuestHomeFeed({
      localHistory: req.body?.localHistory,
    });

  return sendSuccess(res, { data: result });
});

module.exports = {
  postGuestHomeFeed,
};
