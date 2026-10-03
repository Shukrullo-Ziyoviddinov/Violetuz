/**
 * GET /api/music/:id/similar?type=music|klip|album  (public, cache-only)
 *
 * Mount: router.use('/music', musicSimilarRoutes) — music.routes dan OLDIN.
 * movie-similar / recommendation-music routelariga tegilmaydi.
 *
 * @module music-similar/routes
 */

'use strict';

const { Router } = require('express');
const { getSimilarMusicItems } = require('../controllers/similar.controller');

const router = Router();

router.get('/:id/similar', getSimilarMusicItems);

module.exports = router;
