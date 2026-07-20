const { Router } = require('express');
const { getClipSections } = require('../controllers/clipSection.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = Router();

router.get('/', asyncHandler(getClipSections));

module.exports = router;
