const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { requireAdmin } = require('../middleware/auth.middleware');

/**
 * Admin write APIs — URL-only media (direct-to-R2 via /uploads/presign).
 * Base: /api/v1/admin
 *
 * Template for future entities: same pattern (requireAdmin + assertR2MediaUrl).
 */
const router = Router();

router.use(requireAdmin);

router.get('/me', asyncHandler(adminController.adminMe));

router.get('/genres', asyncHandler(adminController.listGenres));
router.post('/genres', asyncHandler(adminController.createGenre));
router.patch('/genres/:id', asyncHandler(adminController.updateGenre));
router.delete('/genres/:id', asyncHandler(adminController.deleteGenre));

router.get('/banners', asyncHandler(adminController.listBanners));
router.post('/banners', asyncHandler(adminController.createBanner));
router.patch('/banners/:id', asyncHandler(adminController.updateBanner));
router.delete('/banners/:id', asyncHandler(adminController.deleteBanner));

module.exports = router;
