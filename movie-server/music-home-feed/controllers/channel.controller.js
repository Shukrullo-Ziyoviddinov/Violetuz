/**
 * Kanal "Siz uchun tavsiyalar".
 * GET  /api/music-home-feed/channel/:channelId
 * POST /api/music-home-feed/channel/:channelId/guest
 *
 * @module music-home-feed/controllers/channel.controller
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { badRequest } = require('../../utils/errors');
const {
  getChannelMusicFeed,
  getChannelGuestMusicFeed,
} = require('../services/channelFeed.service');

const readChannelId = (params) => {
  const channelId = String(params?.channelId || '').trim();
  if (!channelId) throw badRequest('channelId majburiy');
  return channelId;
};

const getChannelMusicFeedHandler = asyncHandler(async (req, res) => {
  const result = await getChannelMusicFeed({
    channelId: readChannelId(req.params),
    userId: req.authUser._id,
  });
  return sendSuccess(res, { data: result });
});

const postChannelGuestMusicFeed = asyncHandler(async (req, res) => {
  const result = await getChannelGuestMusicFeed({
    channelId: readChannelId(req.params),
    localHistory: req.body?.localHistory,
  });
  return sendSuccess(res, { data: result });
});

module.exports = {
  getChannelMusicFeedHandler,
  postChannelGuestMusicFeed,
};
