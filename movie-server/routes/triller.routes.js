const { Router } = require('express');
const trillerController = require('../controllers/triller.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { validateTrillerIdParam } = require('../middleware/validators');

const router = Router();

router.get('/:id', validateTrillerIdParam, asyncHandler(trillerController.getTrillerById));
router.get('/', asyncHandler(trillerController.getTrillers));

module.exports = router;
