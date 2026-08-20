const { Router } = require('express');
const viewController = require('../controllers/view.controller');
const { requireAuth } = require('../middleware/auth.middleware');

/**
 * Kontent ko‘rishlari — umumiy (movie / music / klip / konsert / triller).
 * Base: /api/views
 *
 * GET  /count?type=&id=  — jami son (auth shart emas)
 * POST /                 — login user kirganda +1 (bir user = bir marta)
 */
const router = Router();

router.get('/count', viewController.getCount);
router.post('/', requireAuth, viewController.recordView);

module.exports = router;
