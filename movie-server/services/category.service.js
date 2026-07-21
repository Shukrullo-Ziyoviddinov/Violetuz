const CategoryModel = require('../models/Category.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class CategoryService {
  async getAll(filters = {}) {
    const query = {};

    if (filters.search) {
      const escaped = String(filters.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (escaped) {
        query.$or = [
          { id: { $regex: escaped, $options: 'i' } },
          { 'title.uz': { $regex: escaped, $options: 'i' } },
          { 'title.ru': { $regex: escaped, $options: 'i' } },
        ];
      }
    }

    const items = await CategoryModel.find(query).sort({ sortOrder: 1, id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const categoryId = String(id || '').trim();
    if (!categoryId) {
      throw badRequest(`Invalid category id: ${id}`);
    }

    const item = await CategoryModel.findOne({ id: categoryId }).lean();
    if (!item) {
      throw notFound(`Category not found: ${id}`);
    }

    return stripMongoId(item);
  }

  async create(data) {
    const rest = { ...(data || {}) };
    if (rest.id) {
      rest.id = String(rest.id).trim();
    }

    const item = new CategoryModel(rest);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new CategoryService();
