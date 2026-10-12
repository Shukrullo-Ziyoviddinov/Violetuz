/**
 * Mehmon "Siz uchun albomlar" POST limiti.
 * Musiqa home-feed guest limiti bilan umumiy emas.
 *
 * @module album-home-feed/middleware/guestRateLimit
 */

'use strict';

const rateLimit = require('express-rate-limit');

const guestAlbumHomeFeedRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many guest album home-feed requests, try again later',
  },
});

module.exports = {
  guestAlbumHomeFeedRateLimit,
};
