/**
 * Rate limit for unauthenticated guest recommended-actors POSTs.
 * Requires app.set('trust proxy', …) so req.ip is the real client.
 *
 * @module recommendation-actors/middleware/guestRateLimit
 */

'use strict';

const rateLimit = require('express-rate-limit');

const guestRecommendedActorsRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many guest recommended-actors requests, try again later',
  },
});

module.exports = {
  guestRecommendedActorsRateLimit,
};
