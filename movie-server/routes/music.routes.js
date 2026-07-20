const { Router } = require('express');
const musicController = require('../controllers/music.controller');
const asyncHandler = require('../middleware/asyncHandler');
const {
  validateMusicIdParam,
  validateMusicCategoryParam,
  validateMusicArtistParam,
  validateMusicListQuery,
} = require('../middleware/validators');

const router = Router();

router.get(
  '/category/:categoryNameMusic',
  validateMusicCategoryParam,
  asyncHandler(musicController.getMusicByCategory)
);
router.get(
  '/artist/:artistId',
  validateMusicArtistParam,
  asyncHandler(musicController.getMusicByArtist)
);
router.get('/:id', validateMusicIdParam, asyncHandler(musicController.getMusicById));
router.get('/', validateMusicListQuery, asyncHandler(musicController.getMusicList));

module.exports = router;
