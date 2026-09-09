/**
 * Recommended artists HTTP routes.
 *
 * GET /api/recommended-artists/config  (public)
 * GET /api/recommended-artists?limit=  (auth)
 *
 * @module recommendation-artists/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const controller = require('../controllers');

const router = Router();

router.get('/config', controller.getConfig);
router.get('/', requireAuth, controller.listRecommendedArtists);

module.exports = router;
