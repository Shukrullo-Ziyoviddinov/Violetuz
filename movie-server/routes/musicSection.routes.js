const { Router } = require('express');
const {
  getMusicSections,
  getMusicSectionById,
  getMusicPageContent,
} = require('../controllers/musicSection.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = Router();

// Static path before /:id so "page-content" is not treated as a section id
router.get('/page-content', asyncHandler(getMusicPageContent));
router.get('/:id', asyncHandler(getMusicSectionById));
router.get('/', asyncHandler(getMusicSections));

module.exports = router;
