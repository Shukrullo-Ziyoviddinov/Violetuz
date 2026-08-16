const { Router } = require('express');
const wishlistController = require('../controllers/wishlist.controller');
const { requireAuth } = require('../middleware/auth.middleware');

/**
 * Wishlist — login bo‘lgan user uchun.
 * Base: /api/wishlist
 */
const router = Router();

router.use(requireAuth);

router.get('/', wishlistController.listWishlist);
router.put('/', wishlistController.replaceWishlist);
router.post('/items', wishlistController.addItem);
router.delete('/items', wishlistController.removeItem);
router.post('/items/toggle', wishlistController.toggleItem);

module.exports = router;
