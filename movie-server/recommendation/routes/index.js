/**
 * Recommendation HTTP routes.
 *
 * GET  /api/recommendations/config/progress       (public knobs)
 * GET  /api/recommendations/weekly-top            (public, read-only WatchEvent)
 * GET  /api/recommendations/monthly-top           (public, same ranker, 30-day window)
 * POST /api/recommendations/:category/guest       (public, rate-limited, no DB write)
 * GET  /api/recommendations/:category?limit=      (auth)
 * POST /api/recommendations/progress              (auth) — threshold + max progress upsert
 *
 * @module recommendation/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const recommendationController = require('../controllers');
const {
  guestRecommendationsRateLimit,
} = require('../middleware/guestRateLimit');

const router = Router();

router.get('/config/progress', recommendationController.getProgressConfig);
router.get('/weekly-top', recommendationController.getWeeklyTopMovies);
router.get('/monthly-top', recommendationController.getMonthlyTopMovies);
router.post('/progress', requireAuth, recommendationController.postProgress);

// Guest path — before auth GET so :category/guest is not swallowed incorrectly
router.post(
  '/:category/guest',
  guestRecommendationsRateLimit,
  recommendationController.postGuestByCategory
);

router.get('/:category', requireAuth, recommendationController.getByCategory);

module.exports = router;
