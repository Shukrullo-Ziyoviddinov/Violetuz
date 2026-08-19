const { Router } = require('express');
const feedController = require('../controllers/feed.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

/**
 * Shaxsiy feed — obuna + katalog (avto id, Mongo).
 * Base: /api/feed
 */
const router = Router();

router.get('/', optionalAuth, feedController.listFeed);

module.exports = router;
