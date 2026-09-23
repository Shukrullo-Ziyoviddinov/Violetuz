/**
 * Mehmon "Siz uchun" POST limiti. Bo'lim guest limiti bilan umumiy emas.
 *
 * @module home-feed/middleware/guestRateLimit
 */

'use strict';

const rateLimit = require('express-rate-limit');

const guestHomeFeedRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many guest home-feed requests, try again later',
  },
});

module.exports = {
  guestHomeFeedRateLimit,
};
