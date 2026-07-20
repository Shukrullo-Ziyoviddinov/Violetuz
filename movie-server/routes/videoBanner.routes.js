const { Router } = require('express');
const videoBannerController = require('../controllers/videoBanner.controller');
const asyncHandler = require('../middleware/asyncHandler');
const {
  validateVideoBannerIdParam,
  validateVideoBannerTypeParam,
  validateVideoBannerListQuery,
} = require('../middleware/validators');

const router = Router();

router.get(
  '/type/:type',
  validateVideoBannerTypeParam,
  asyncHandler(videoBannerController.getVideoBannersByType)
);
router.get('/:id', validateVideoBannerIdParam, asyncHandler(videoBannerController.getVideoBannerById));
router.get('/', validateVideoBannerListQuery, asyncHandler(videoBannerController.getVideoBanners));

module.exports = router;
