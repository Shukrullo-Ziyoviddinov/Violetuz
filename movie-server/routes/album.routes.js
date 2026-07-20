const { Router } = require('express');
const albumController = require('../controllers/album.controller');
const asyncHandler = require('../middleware/asyncHandler');
const {
  validateAlbumIdParam,
  validateMusicCategoryParam,
  validateMusicArtistParam,
  validateAlbumListQuery,
} = require('../middleware/validators');

const router = Router();

router.get(
  '/category/:categoryNameMusic',
  validateMusicCategoryParam,
  asyncHandler(albumController.getAlbumsByCategory)
);
router.get(
  '/artist/:artistId',
  validateMusicArtistParam,
  asyncHandler(albumController.getAlbumsByArtist)
);
router.get('/:id', validateAlbumIdParam, asyncHandler(albumController.getAlbumById));
router.get('/', validateAlbumListQuery, asyncHandler(albumController.getAlbums));

module.exports = router;
