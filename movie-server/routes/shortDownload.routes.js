const { Router } = require('express');
const shortDownloadController = require('../controllers/shortDownload.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

/**
 * Shorts download hisobi — fayl R2 dan clientda yuklanadi.
 * Server diskka yozmaydi; faqat muvaffaqiyatli yuklash +1.
 * Base: /api/short-downloads
 *
 * GET  /count?type=&id=  — jami son
 * POST /events           — 100% dan keyin +1 (auth ixtiyoriy)
 */
const router = Router();

router.get('/count', shortDownloadController.getCount);
router.post('/events', optionalAuth, shortDownloadController.recordDownload);

module.exports = router;
