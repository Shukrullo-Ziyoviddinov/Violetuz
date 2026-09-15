/**
 * Rate limit for unauthenticated music guest recommendation POSTs.
 * Reuses same policy as movie guest (trust proxy set on app).
 *
 * @module recommendation-music/middleware/guestRateLimit
 */

'use strict';

const rateLimit = require('express-rate-limit');

const guestMusicRecommendationsRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many guest music recommendation requests, try again later',
  },
});

module.exports = {
  guestMusicRecommendationsRateLimit,
};
