const { Router } = require('express');
const categoryController = require('../controllers/category.controller');
const asyncHandler = require('../middleware/asyncHandler');
const {
  validateNavCategoryIdParam,
  validateNavCategoryListQuery,
} = require('../middleware/validators');

const router = Router();

// Static "/" must be registered before "/:id"
router.get('/', validateNavCategoryListQuery, asyncHandler(categoryController.getCategories));
router.get('/:id', validateNavCategoryIdParam, asyncHandler(categoryController.getCategoryById));

module.exports = router;
