const { Router } = require('express');
const movieRatingController = require('../controllers/movieRating.controller');
const { requireAuth } = require('../middleware/auth.middleware');

/**
 * Movie rating (1–10) + history.
 * Base: /api/movie-ratings
 */
const router = Router();

router.use(requireAuth);

router.get('/history', movieRatingController.listHistory);
router.get('/me/:movieId', movieRatingController.getMyRating);
router.post('/', movieRatingController.submitRating);

module.exports = router;
