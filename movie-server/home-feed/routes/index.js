/**
 * GET  /api/home-feed                         cookie user, home_feed_cache
 * POST /api/home-feed/guest                   auth yo'q, yozuv yo'q
 * GET  /api/home-feed/channel/:channelId      kanal, keshga yozilmaydi
 * POST /api/home-feed/channel/:channelId/guest
 *
 * @module home-feed/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { guestHomeFeedRateLimit } = require('../middleware/guestRateLimit');
const { postGuestHomeFeed } = require('../controllers/guest.controller');
const { getLoginHomeFeedHandler } = require('../controllers/login.controller');
const {
  getChannelHomeFeedHandler,
  postChannelGuestHomeFeed,
} = require('../controllers/channel.controller');

const router = Router();

router.get('/channel/:channelId', requireAuth, getChannelHomeFeedHandler);
router.post('/channel/:channelId/guest', guestHomeFeedRateLimit, postChannelGuestHomeFeed);
router.post('/guest', guestHomeFeedRateLimit, postGuestHomeFeed);
router.get('/', requireAuth, getLoginHomeFeedHandler);

module.exports = router;
