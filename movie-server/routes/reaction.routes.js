const { Router } = require('express');
const reactionController = require('../controllers/reaction.controller');
const { requireAuth } = require('../middleware/auth.middleware');

/**
 * User reactions (like/dislike) — bitta collection, type bilan.
 * Base: /api/reactions
 */
const router = Router();

router.use(requireAuth);

router.get('/', reactionController.listReactions);
router.get('/history', reactionController.listLikeHistory);
router.put('/', reactionController.replaceReactions);
router.post('/', reactionController.setReaction);
router.post('/shorts/toggle', reactionController.toggleShortsLike);

module.exports = router;
