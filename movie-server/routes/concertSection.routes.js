const { Router } = require('express');
const { getConcertSections } = require('../controllers/concertSection.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = Router();

router.get('/', asyncHandler(getConcertSections));

module.exports = router;
