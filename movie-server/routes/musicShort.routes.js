const { Router } = require('express');
const musicShortController = require('../controllers/musicShort.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { optionalAuth } = require('../middleware/auth.middleware');
const {
  validateMusicShortIdParam,
  validateMusicArtistParam,
  validateMusicShortListQuery,
} = require('../middleware/validators');

const router = Router();

router.get(
  '/artist/:artistId',
  optionalAuth,
  validateMusicArtistParam,
  asyncHandler(musicShortController.getMusicShortsByArtist)
);
router.get(
  '/:id',
  optionalAuth,
  validateMusicShortIdParam,
  asyncHandler(musicShortController.getMusicShortById)
);
router.get('/', optionalAuth, validateMusicShortListQuery, asyncHandler(musicShortController.getMusicShorts));

module.exports = router;
