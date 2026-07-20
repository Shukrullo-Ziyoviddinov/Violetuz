const { Router } = require('express');
const { getMusicSections, getMusicPageContent } = require('../controllers/musicSection.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = Router();

router.get('/page-content', asyncHandler(getMusicPageContent));
router.get('/', asyncHandler(getMusicSections));

module.exports = router;
