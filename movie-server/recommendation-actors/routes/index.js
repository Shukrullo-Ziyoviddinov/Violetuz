/**
 * Recommended actors HTTP routes.
 *
 * GET /api/recommended-actors/config  (public)
 * GET /api/recommended-actors?limit=  (auth)
 *
 * @module recommendation-actors/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const controller = require('../controllers');

const router = Router();

router.get('/config', controller.getConfig);
router.get('/', requireAuth, controller.listRecommendedActors);

module.exports = router;
