const { Router } = require('express');
const followingController = require('../controllers/following.controller');
const { requireAuth } = require('../middleware/auth.middleware');

/**
 * Following — actor / artist obunalari.
 * Base: /api/following
 */
const router = Router();

router.use(requireAuth);

router.get('/', followingController.listFollowing);
router.put('/', followingController.replaceFollowing);
router.post('/', followingController.addFollow);
router.delete('/', followingController.removeFollow);
router.post('/toggle', followingController.toggleFollow);

module.exports = router;
