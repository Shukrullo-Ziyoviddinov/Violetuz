const { Router } = require('express');
const movieController = require('../controllers/movie.controller');
const asyncHandler = require('../middleware/asyncHandler');
const {
  validateMovieIdParam,
  validateCategoryParam,
  validateMovieListQuery,
} = require('../middleware/validators');

const router = Router();

router.get(
  '/category/:categoryName',
  validateCategoryParam,
  asyncHandler(movieController.getMoviesByCategory)
);
router.get('/:id', validateMovieIdParam, asyncHandler(movieController.getMovieById));
router.get('/', validateMovieListQuery, asyncHandler(movieController.getMovies));

module.exports = router;
