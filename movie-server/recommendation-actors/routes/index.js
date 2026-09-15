/**
 * Recommended actors HTTP routes.
 *
 * GET  /api/recommended-actors/config       (public)
 * GET  /api/recommended-actors/trending     (public)
 * GET  /api/recommended-actors/top          (public)
 * GET  /api/recommended-actors/weekly-top   (public)
 * POST /api/recommended-actors/guest        (public, rate-limited, no DB write)
 * GET  /api/recommended-actors?limit=       (auth)
 *
 * @module recommendation-actors/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const controller = require('../controllers');
const {
  guestRecommendedActorsRateLimit,
} = require('../middleware/guestRateLimit');

const router = Router();

router.get('/config', controller.getConfig);
router.get('/trending', controller.listTrendingActors);
router.get('/top', controller.listTopActors);
router.get('/weekly-top', controller.listWeeklyTopActors);

router.post(
  '/guest',
  guestRecommendedActorsRateLimit,
  controller.postGuestRecommendedActors
);

router.get('/', requireAuth, controller.listRecommendedActors);

module.exports = router;
