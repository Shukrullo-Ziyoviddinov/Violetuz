const { Router } = require('express');
const actorPageLabelController = require('../controllers/actorPageLabel.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { validateActorPageLabelIdParam } = require('../middleware/validators');

const router = Router();

router.get(
  '/:id',
  validateActorPageLabelIdParam,
  asyncHandler(actorPageLabelController.getActorPageLabelById)
);
router.get('/', asyncHandler(actorPageLabelController.getActorPageLabels));

module.exports = router;
