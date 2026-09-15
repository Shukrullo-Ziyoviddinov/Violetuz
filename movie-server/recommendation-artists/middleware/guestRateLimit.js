/**
 * Rate limit for unauthenticated guest recommended-artists POSTs.
 * Requires app.set('trust proxy', …) so req.ip is the real client.
 *
 * @module recommendation-artists/middleware/guestRateLimit
 */

'use strict';

const rateLimit = require('express-rate-limit');

const guestRecommendedArtistsRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many guest recommended-artists requests, try again later',
  },
});

module.exports = {
  guestRecommendedArtistsRateLimit,
};
