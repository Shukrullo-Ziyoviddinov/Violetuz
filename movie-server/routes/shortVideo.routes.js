const { Router } = require('express');
const shortVideoController = require('../controllers/shortVideo.controller');
const asyncHandler = require('../middleware/asyncHandler');
const {
  validateShortVideoIdParam,
  validateShortVideoMovieIdParam,
  validateShortVideoListQuery,
} = require('../middleware/validators');

const router = Router();

router.get(
  '/movie/:movieId',
  validateShortVideoMovieIdParam,
  asyncHandler(shortVideoController.getShortsByMovieId)
);
router.get('/:id', validateShortVideoIdParam, asyncHandler(shortVideoController.getShortById));
router.get('/', validateShortVideoListQuery, asyncHandler(shortVideoController.getShorts));

module.exports = router;
