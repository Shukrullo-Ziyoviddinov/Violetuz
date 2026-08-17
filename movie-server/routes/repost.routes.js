const { Router } = require('express');
const repostController = require('../controllers/repost.controller');
const { requireAuth } = require('../middleware/auth.middleware');

/**
 * Reposts — login bo‘lgan user uchun.
 * Base: /api/reposts
 */
const router = Router();

router.use(requireAuth);

router.get('/ids', repostController.listRepostIds);
router.get('/', repostController.listReposts);
router.put('/', repostController.replaceReposts);
router.post('/items', repostController.addItem);
router.delete('/items', repostController.removeItem);
router.post('/items/toggle', repostController.toggleItem);

module.exports = router;
