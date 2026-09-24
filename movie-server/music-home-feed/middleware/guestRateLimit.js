/**
 * Mehmon "Sizga mos musiqalar" POST limiti.
 * Musiqa bo'lim guest limiti bilan umumiy emas.
 *
 * @module music-home-feed/middleware/guestRateLimit
 */

'use strict';

const rateLimit = require('express-rate-limit');

const guestMusicHomeFeedRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many guest music home-feed requests, try again later',
  },
});

module.exports = {
  guestMusicHomeFeedRateLimit,
};
