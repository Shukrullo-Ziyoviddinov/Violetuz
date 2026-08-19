const { Router } = require('express');
const clipController = require('../controllers/clip.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { optionalAuth } = require('../middleware/auth.middleware');
const {
  validateClipIdParam,
  validateMusicCategoryParam,
  validateMusicArtistParam,
  validateClipListQuery,
} = require('../middleware/validators');

const router = Router();

router.get(
  '/category/:categoryNameMusic',
  validateMusicCategoryParam,
  asyncHandler(clipController.getClipsByCategory)
);
router.get(
  '/artist/:artistId',
  validateMusicArtistParam,
  asyncHandler(clipController.getClipsByArtist)
);
router.get('/:id', optionalAuth, validateClipIdParam, asyncHandler(clipController.getClipById));
router.get('/', validateClipListQuery, asyncHandler(clipController.getClips));

module.exports = router;
