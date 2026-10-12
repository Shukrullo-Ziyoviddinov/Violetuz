/**
 * GET  /api/album-home-feed        cookie user, album_home_feed_cache
 * POST /api/album-home-feed/guest  auth yo'q, yozuv yo'q
 *
 * music-home-feed route ga ulanmaydi.
 *
 * @module album-home-feed/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { guestAlbumHomeFeedRateLimit } = require('../middleware/guestRateLimit');
const { postGuestAlbumFeed } = require('../controllers/guest.controller');
const { getLoginAlbumFeedHandler } = require('../controllers/login.controller');

const router = Router();

router.post('/guest', guestAlbumHomeFeedRateLimit, postGuestAlbumFeed);
router.get('/', requireAuth, getLoginAlbumFeedHandler);

module.exports = router;
