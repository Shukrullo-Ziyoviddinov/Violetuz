const { Router } = require('express');
const concertController = require('../controllers/concert.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { optionalAuth } = require('../middleware/auth.middleware');
const {
  validateConcertIdParam,
  validateMusicCategoryParam,
  validateMusicArtistParam,
  validateConcertListQuery,
} = require('../middleware/validators');

const router = Router();

router.get(
  '/category/:categoryNameMusic',
  validateMusicCategoryParam,
  asyncHandler(concertController.getConcertsByCategory)
);
router.get(
  '/artist/:artistId',
  validateMusicArtistParam,
  asyncHandler(concertController.getConcertsByArtist)
);
router.get('/:id', optionalAuth, validateConcertIdParam, asyncHandler(concertController.getConcertById));
router.get('/', validateConcertListQuery, asyncHandler(concertController.getConcerts));

module.exports = router;
