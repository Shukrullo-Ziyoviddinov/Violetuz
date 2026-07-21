const categoryService = require('../services/category.service');
const { sendSuccess } = require('../utils/response');

const getCategories = async (req, res) => {
  const { search } = req.query;
  const items = await categoryService.getAll({ search });

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getCategoryById = async (req, res) => {
  const item = await categoryService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

module.exports = {
  getCategories,
  getCategoryById,
};
