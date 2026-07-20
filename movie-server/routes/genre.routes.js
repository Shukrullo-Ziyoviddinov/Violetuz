const { Router } = require('express');
const genreController = require('../controllers/genre.controller');
const asyncHandler = require('../middleware/asyncHandler');
const {
  validateGenreIdParam,
  validateGenreListQuery,
} = require('../middleware/validators');

const router = Router();

router.get('/:id', validateGenreIdParam, asyncHandler(genreController.getGenreById));
router.get('/', validateGenreListQuery, asyncHandler(genreController.getGenres));

module.exports = router;
