const { Router } = require('express');
const musicBannerController = require('../controllers/musicBanner.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { validateMusicBannerIdParam } = require('../middleware/validators');

const router = Router();

router.get('/:id', validateMusicBannerIdParam, asyncHandler(musicBannerController.getMusicBannerById));
router.get('/', asyncHandler(musicBannerController.getMusicBanners));

module.exports = router;
