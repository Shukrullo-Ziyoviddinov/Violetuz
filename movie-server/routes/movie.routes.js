const { Router } = require('express');
const movieController = require('../controllers/movie.controller');
const asyncHandler = require('../middleware/asyncHandler');
const {
  validateMovieIdParam,
  validateCategoryParam,
  validateMovieListQuery,
} = require('../middleware/validators');
const { optionalAuth } = require('../middleware/auth.middleware');

const router = Router();

router.get(
  '/category/:categoryName',
  validateCategoryParam,
  asyncHandler(movieController.getMoviesByCategory)
);
router.get('/:id', optionalAuth, validateMovieIdParam, asyncHandler(movieController.getMovieById));
router.get('/', validateMovieListQuery, asyncHandler(movieController.getMovies));

module.exports = router;
