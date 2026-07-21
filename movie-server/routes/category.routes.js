const { Router } = require('express');
const categoryController = require('../controllers/category.controller');
const asyncHandler = require('../middleware/asyncHandler');
const {
  validateNavCategoryIdParam,
  validateNavCategoryListQuery,
} = require('../middleware/validators');

const router = Router();

router.get('/:id', validateNavCategoryIdParam, asyncHandler(categoryController.getCategoryById));
router.get('/', validateNavCategoryListQuery, asyncHandler(categoryController.getCategories));

module.exports = router;
