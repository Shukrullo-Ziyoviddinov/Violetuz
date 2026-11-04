/**
 * GET  /api/music-home-feed                         cookie user, music_home_feed_cache
 * POST /api/music-home-feed/guest                   auth yo'q, yozuv yo'q
 * GET  /api/music-home-feed/channel/:channelId      kanal, keshga yozilmaydi
 * POST /api/music-home-feed/channel/:channelId/guest
 *
 * @module music-home-feed/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { guestMusicHomeFeedRateLimit } = require('../middleware/guestRateLimit');
const { postGuestMusicFeed } = require('../controllers/guest.controller');
const { getLoginMusicFeedHandler } = require('../controllers/login.controller');
const {
  getChannelMusicFeedHandler,
  postChannelGuestMusicFeed,
} = require('../controllers/channel.controller');

const router = Router();

router.get('/channel/:channelId', requireAuth, getChannelMusicFeedHandler);
router.post('/channel/:channelId/guest', guestMusicHomeFeedRateLimit, postChannelGuestMusicFeed);
router.post('/guest', guestMusicHomeFeedRateLimit, postGuestMusicFeed);
router.get('/', requireAuth, getLoginMusicFeedHandler);

module.exports = router;
