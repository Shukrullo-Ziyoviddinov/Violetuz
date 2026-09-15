/**
 * Rate limit for unauthenticated guest recommendation POSTs.
 *
 * @module recommendation/middleware/guestRateLimit
 */

'use strict';

const rateLimit = require('express-rate-limit');

/** Home may hit many categories; keep headroom but block abuse.
 * Requires app.set('trust proxy', …) in production so req.ip is real client.
 */
const guestRecommendationsRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many guest recommendation requests, try again later',
  },
});

module.exports = {
  guestRecommendationsRateLimit,
};
