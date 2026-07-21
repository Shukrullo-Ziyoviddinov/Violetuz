const { Router } = require('express');
const artistController = require('../controllers/artist.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { validateArtistIdParam } = require('../middleware/validators');

const router = Router();

router.get('/:id', validateArtistIdParam, asyncHandler(artistController.getArtistById));
router.get('/', asyncHandler(artistController.getArtists));

module.exports = router;
