const { Router } = require('express');
const {
  getMovieSections,
  getMovieSectionById,
  getHomeContent,
} = require('../controllers/movieSection.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = Router();

// Static path before /:id so "home-content" is not treated as a section id
router.get('/home-content', asyncHandler(getHomeContent));
router.get('/:id', asyncHandler(getMovieSectionById));
router.get('/', asyncHandler(getMovieSections));

module.exports = router;
