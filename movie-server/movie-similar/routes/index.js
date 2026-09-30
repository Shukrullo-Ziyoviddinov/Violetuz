/**
 * GET /api/movies/:movieId/similar  (public, cache-only)
 *
 * Mount: router.use('/movies', movieSimilarRoutes) — movie.routes dan OLDIN.
 * recommendation / home-feed routelariga tegilmaydi.
 *
 * @module movie-similar/routes
 */

'use strict';

const { Router } = require('express');
const { getSimilarMovies } = require('../controllers/similar.controller');

const router = Router();

router.get('/:movieId/similar', getSimilarMovies);

module.exports = router;
