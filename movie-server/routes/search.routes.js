const { Router } = require('express');
const searchController = require('../controllers/search.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { validateSearchQuery } = require('../middleware/validators');

const router = Router();

router.get('/', validateSearchQuery, asyncHandler(searchController.searchContent));

module.exports = router;
