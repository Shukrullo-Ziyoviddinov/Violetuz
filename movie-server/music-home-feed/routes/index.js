/**
 * GET  /api/music-home-feed        cookie user, music_home_feed_cache
 * POST /api/music-home-feed/guest  auth yo'q, yozuv yo'q
 *
 * @module music-home-feed/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { guestMusicHomeFeedRateLimit } = require('../middleware/guestRateLimit');
const { postGuestMusicFeed } = require('../controllers/guest.controller');
const { getLoginMusicFeedHandler } = require('../controllers/login.controller');

const router = Router();

router.post('/guest', guestMusicHomeFeedRateLimit, postGuestMusicFeed);
router.get('/', requireAuth, getLoginMusicFeedHandler);

module.exports = router;
