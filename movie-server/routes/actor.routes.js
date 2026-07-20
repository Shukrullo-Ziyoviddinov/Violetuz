const { Router } = require('express');
const actorController = require('../controllers/actor.controller');
const asyncHandler = require('../middleware/asyncHandler');
const {
  validateActorIdParam,
  validateActorsGenreParam,
  validateActorListQuery,
} = require('../middleware/validators');

const router = Router();

router.get(
  '/genre/:actorsGenre',
  validateActorsGenreParam,
  asyncHandler(actorController.getActorsByGenre)
);
router.get('/:id', validateActorIdParam, asyncHandler(actorController.getActorById));
router.get('/', validateActorListQuery, asyncHandler(actorController.getActors));

module.exports = router;
