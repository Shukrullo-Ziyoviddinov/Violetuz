const { Router } = require('express');
const {
  getClipSections,
  getClipSectionById,
} = require('../controllers/clipSection.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = Router();

router.get('/:id', asyncHandler(getClipSectionById));
router.get('/', asyncHandler(getClipSections));

module.exports = router;
