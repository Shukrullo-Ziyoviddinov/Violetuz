const { Router } = require('express');
const bannerController = require('../controllers/banner.controller');
const asyncHandler = require('../middleware/asyncHandler');
const {
  validateBannerIdParam,
  validateBannerLangParam,
  validateBannerListQuery,
} = require('../middleware/validators');

const router = Router();

router.get(
  '/lang/:lang',
  validateBannerLangParam,
  asyncHandler(bannerController.getBannersByLang)
);
router.get('/:id', validateBannerIdParam, asyncHandler(bannerController.getBannerById));
router.get('/', validateBannerListQuery, asyncHandler(bannerController.getBanners));

module.exports = router;
