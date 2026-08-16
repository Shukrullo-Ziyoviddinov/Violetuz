const { Router } = require('express');
const commentController = require('../controllers/comment.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');

/**
 * Polimorf comments.
 * Base: /api/comments
 */
const router = Router();

router.get('/', optionalAuth, commentController.listComments);
router.get('/history', requireAuth, commentController.listHistory);
router.get('/liked', requireAuth, commentController.listLikedIds);

router.post('/', requireAuth, commentController.createComment);
router.patch('/:id', requireAuth, commentController.updateComment);
router.delete('/:id', requireAuth, commentController.deleteComment);
router.post('/:id/like', requireAuth, commentController.toggleLike);

module.exports = router;
