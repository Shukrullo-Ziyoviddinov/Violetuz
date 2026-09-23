/**
 * GET  /api/home-feed        cookie user, home_feed_cache
 * POST /api/home-feed/guest  auth yo'q, yozuv yo'q
 *
 * @module home-feed/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { guestHomeFeedRateLimit } = require('../middleware/guestRateLimit');
const { postGuestHomeFeed } = require('../controllers/guest.controller');
const { getLoginHomeFeedHandler } = require('../controllers/login.controller');

const router = Router();

router.post('/guest', guestHomeFeedRateLimit, postGuestHomeFeed);
router.get('/', requireAuth, getLoginHomeFeedHandler);

module.exports = router;
