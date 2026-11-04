/**
 * Kanal "Tavsiya etamiz".
 * GET  /api/home-feed/channel/:channelId
 * POST /api/home-feed/channel/:channelId/guest
 *
 * @module home-feed/controllers/channel.controller
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { badRequest } = require('../../utils/errors');
const {
  getChannelHomeFeed,
  getChannelGuestHomeFeed,
} = require('../services/channelFeed.service');

const readChannelId = (params) => {
  const channelId = String(params?.channelId || '').trim();
  if (!channelId) throw badRequest('channelId majburiy');
  return channelId;
};

const getChannelHomeFeedHandler = asyncHandler(async (req, res) => {
  const result = await getChannelHomeFeed({
    channelId: readChannelId(req.params),
    userId: req.authUser._id,
  });
  return sendSuccess(res, { data: result });
});

const postChannelGuestHomeFeed = asyncHandler(async (req, res) => {
  const result = await getChannelGuestHomeFeed({
    channelId: readChannelId(req.params),
    localHistory: req.body?.localHistory,
  });
  return sendSuccess(res, { data: result });
});

module.exports = {
  getChannelHomeFeedHandler,
  postChannelGuestHomeFeed,
};
