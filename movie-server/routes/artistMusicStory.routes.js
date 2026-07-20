const { Router } = require('express');
const artistMusicStoryController = require('../controllers/artistMusicStory.controller');
const asyncHandler = require('../middleware/asyncHandler');
const {
  validateArtistMusicStoryIdParam,
  validateMusicArtistParam,
  validateArtistMusicStoryListQuery,
} = require('../middleware/validators');

const router = Router();

router.get(
  '/artist/:artistId',
  validateMusicArtistParam,
  asyncHandler(artistMusicStoryController.getArtistMusicStoriesByArtist)
);
router.get(
  '/:id',
  validateArtistMusicStoryIdParam,
  asyncHandler(artistMusicStoryController.getArtistMusicStoryById)
);
router.get(
  '/',
  validateArtistMusicStoryListQuery,
  asyncHandler(artistMusicStoryController.getArtistMusicStories)
);

module.exports = router;
