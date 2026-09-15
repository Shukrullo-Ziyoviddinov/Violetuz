/**
 * Recommended artists HTTP routes.
 *
 * GET  /api/recommended-artists/config       (public)
 * GET  /api/recommended-artists/trending     (public)
 * GET  /api/recommended-artists/top          (public)
 * GET  /api/recommended-artists/weekly-top   (public)
 * POST /api/recommended-artists/guest        (public, rate-limited, no DB write)
 * GET  /api/recommended-artists?limit=       (auth)
 *
 * @module recommendation-artists/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const controller = require('../controllers');
const {
  guestRecommendedArtistsRateLimit,
} = require('../middleware/guestRateLimit');

const router = Router();

router.get('/config', controller.getConfig);
router.get('/trending', controller.listTrendingArtists);
router.get('/top', controller.listTopArtists);
router.get('/weekly-top', controller.listWeeklyTopArtists);

router.post(
  '/guest',
  guestRecommendedArtistsRateLimit,
  controller.postGuestRecommendedArtists
);

router.get('/', requireAuth, controller.listRecommendedArtists);

module.exports = router;
