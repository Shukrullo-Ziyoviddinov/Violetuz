const { Router } = require('express');
const trillerController = require('../controllers/triller.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { optionalAuth } = require('../middleware/auth.middleware');
const { validateTrillerIdParam } = require('../middleware/validators');
const {
  guestRecommendationsRateLimit,
} = require('../recommendation/middleware/guestRateLimit');

const router = Router();

router.post(
  '/guest',
  guestRecommendationsRateLimit,
  optionalAuth,
  asyncHandler(trillerController.postGuestTrillers)
);
router.get('/:id', validateTrillerIdParam, asyncHandler(trillerController.getTrillerById));
router.get('/', optionalAuth, asyncHandler(trillerController.getTrillers));

module.exports = router;
