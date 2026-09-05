/**
 * Music recommendation HTTP routes.
 *
 * GET  /api/music-recommendations/config/progress
 * GET  /api/music-recommendations/:categoryNameMusic?limit=
 * POST /api/music-recommendations/progress
 *
 * @module recommendation-music/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const controller = require('../controllers');

const router = Router();

router.get('/config/progress', controller.getProgressConfig);
router.post('/progress', requireAuth, controller.postProgress);
router.get('/:categoryNameMusic', requireAuth, controller.getByCategory);

module.exports = router;
