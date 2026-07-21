const { Router } = require('express');
const {
  getConcertSections,
  getConcertSectionById,
} = require('../controllers/concertSection.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = Router();

router.get('/:id', asyncHandler(getConcertSectionById));
router.get('/', asyncHandler(getConcertSections));

module.exports = router;
