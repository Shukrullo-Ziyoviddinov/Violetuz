/**
 * GET /api/similar-trailers
 * POST /api/similar-trailers/guest
 *
 * @module similar-trailers/routes
 */

'use strict';

const { Router } = require('express');
const asyncHandler = require('../../middleware/asyncHandler');
const { optionalAuth } = require('../../middleware/auth.middleware');
const { guestRecommendationsRateLimit } = require('../../recommendation/middleware/guestRateLimit');
const { getSimilarTrailers, postGuestSimilarTrailers } = require('../controller');

const router = Router();

router.post(
  '/guest',
  guestRecommendationsRateLimit,
  optionalAuth,
  asyncHandler(postGuestSimilarTrailers)
);
router.get('/', optionalAuth, asyncHandler(getSimilarTrailers));

module.exports = router;
