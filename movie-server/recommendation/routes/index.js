/**
 * Recommendation HTTP routes.
 *
 * GET  /api/recommendations/config/progress    (public knobs)
 * GET  /api/recommendations/:category?limit=   (auth)
 * POST /api/recommendations/progress           (auth) — threshold + max progress upsert
 *
 * @module recommendation/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const recommendationController = require('../controllers');

const router = Router();

router.get('/config/progress', recommendationController.getProgressConfig);
router.post('/progress', requireAuth, recommendationController.postProgress);
router.get('/:category', requireAuth, recommendationController.getByCategory);

module.exports = router;
