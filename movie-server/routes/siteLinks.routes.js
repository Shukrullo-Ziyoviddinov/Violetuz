const { Router } = require('express');
const siteLinksController = require('../controllers/siteLinks.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = Router();

router.get('/contact', asyncHandler(siteLinksController.getContact));
router.get('/social', asyncHandler(siteLinksController.getSocialLinks));
router.get('/app-store', asyncHandler(siteLinksController.getAppStoreLinks));
router.get('/', asyncHandler(siteLinksController.getSiteLinks));

module.exports = router;
