const { Router } = require('express');
const shortVideoController = require('../controllers/shortVideo.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { optionalAuth } = require('../middleware/auth.middleware');
const {
  validateShortVideoIdParam,
  validateShortVideoMovieIdParam,
  validateShortVideoListQuery,
} = require('../middleware/validators');

const router = Router();

router.get(
  '/movie/:movieId',
  optionalAuth,
  validateShortVideoMovieIdParam,
  asyncHandler(shortVideoController.getShortsByMovieId)
);
router.get(
  '/:id',
  optionalAuth,
  validateShortVideoIdParam,
  asyncHandler(shortVideoController.getShortById)
);
router.get('/', optionalAuth, validateShortVideoListQuery, asyncHandler(shortVideoController.getShorts));

module.exports = router;
