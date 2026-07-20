const { Router } = require('express');
const { getMovieSections, getHomeContent } = require('../controllers/movieSection.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = Router();

router.get('/home-content', asyncHandler(getHomeContent));
router.get('/', asyncHandler(getMovieSections));

module.exports = router;
