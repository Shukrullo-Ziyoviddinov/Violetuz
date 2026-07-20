const { badRequest } = require('../utils/errors');

const validateMovieIdParam = (req, _res, next) => {
  const numericId = Number(req.params.id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return next(badRequest('Invalid movie id. It must be a positive integer.'));
  }

  req.params.id = String(numericId);
  next();
};

const validateCategoryParam = (req, _res, next) => {
  const categoryName = String(req.params.categoryName || '').trim();
  if (!categoryName) {
    return next(badRequest('Invalid categoryName. It is required.'));
  }

  req.params.categoryName = categoryName;
  next();
};

const validateMovieListQuery = (req, _res, next) => {
  const { categoryName, search } = req.query;

  if (categoryName != null && !String(categoryName).trim()) {
    return next(badRequest('categoryName query cannot be empty.'));
  }

  if (search != null && !String(search).trim()) {
    return next(badRequest('search query cannot be empty.'));
  }

  if (categoryName != null) {
    req.query.categoryName = String(categoryName).trim();
  }

  if (search != null) {
    req.query.search = String(search).trim();
  }

  next();
};

module.exports = {
  validateMovieIdParam,
  validateCategoryParam,
  validateMovieListQuery,
};
