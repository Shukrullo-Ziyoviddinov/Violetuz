const { Router } = require('express');
const adController = require('../controllers/ad.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { validateAdIdParam, validateAdListQuery } = require('../middleware/validators');

const router = Router();

router.get('/active', asyncHandler(adController.getActiveAds));
router.get('/:id', validateAdIdParam, asyncHandler(adController.getAdById));
router.get('/', validateAdListQuery, asyncHandler(adController.getAds));

module.exports = router;
