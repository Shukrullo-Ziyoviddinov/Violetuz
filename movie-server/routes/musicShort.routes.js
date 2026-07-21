const { Router } = require('express');
const musicShortController = require('../controllers/musicShort.controller');
const asyncHandler = require('../middleware/asyncHandler');
const {
  validateMusicShortIdParam,
  validateMusicArtistParam,
  validateMusicShortListQuery,
} = require('../middleware/validators');

const router = Router();

router.get(
  '/artist/:artistId',
  validateMusicArtistParam,
  asyncHandler(musicShortController.getMusicShortsByArtist)
);
router.get('/:id', validateMusicShortIdParam, asyncHandler(musicShortController.getMusicShortById));
router.get('/', validateMusicShortListQuery, asyncHandler(musicShortController.getMusicShorts));

module.exports = router;
