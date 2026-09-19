/**
 * Music recommendation HTTP routes.
 *
 * GET  /api/music-recommendations/config/progress
 * GET  /api/music-recommendations/weekly-top              (public, read-only ListenEvent)
 * GET  /api/music-recommendations/monthly-top             (public, same ranker, 30-day window)
 * GET  /api/music-recommendations/top-charts              (public, weekly+monthly one response)
 * POST /api/music-recommendations/:categoryNameMusic/guest  (public, rate-limited)
 * GET  /api/music-recommendations/:categoryNameMusic?contentType=&limit=
 * POST /api/music-recommendations/progress
 *
 * @module recommendation-music/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const controller = require('../controllers');
const {
  guestMusicRecommendationsRateLimit,
} = require('../middleware/guestRateLimit');

const router = Router();

router.get('/config/progress', controller.getProgressConfig);
router.get('/weekly-top', controller.getWeeklyTopMusic);
router.get('/monthly-top', controller.getMonthlyTopMusic);
router.get('/top-charts', controller.getTopMusicCharts);
router.post('/progress', requireAuth, controller.postProgress);

router.post(
  '/:categoryNameMusic/guest',
  guestMusicRecommendationsRateLimit,
  controller.postGuestByCategory
);

router.get('/:categoryNameMusic', requireAuth, controller.getByCategory);

module.exports = router;
