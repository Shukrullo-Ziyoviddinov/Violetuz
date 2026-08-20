const { Router } = require('express');
const shortShareController = require('../controllers/shortShare.controller');
const { requireAuth } = require('../middleware/auth.middleware');

/**
 * Shorts share hodisalari — har bir kanal bosilishi +1.
 * Base: /api/short-shares
 */
const router = Router();

router.post('/events', requireAuth, shortShareController.recordShare);

module.exports = router;
