const { Router } = require('express');
const uploadController = require('../controllers/upload.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { requireAuth } = require('../middleware/auth.middleware');

/**
 * Media upload helpers (direct-to-R2).
 * Base: /api/v1/uploads  (also /api/uploads)
 *
 * File bytes never hit this server — only metadata + presigned URLs.
 * Auth required so anonymous clients cannot mint upload URLs.
 */
const router = Router();

router.post('/presign', requireAuth, asyncHandler(uploadController.createPresign));
router.post('/delete', requireAuth, asyncHandler(uploadController.deleteUpload));

module.exports = router;
