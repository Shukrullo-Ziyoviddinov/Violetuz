const MovieSectionModel = require('../models/MovieSection.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class MovieSectionService {
  async getAll() {
    const items = await MovieSectionModel.find({}).sort({ sortOrder: 1, id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const sectionId = String(id || '').trim();
    if (!sectionId) {
      throw badRequest(`Invalid movie section id: ${id}`);
    }

    const item = await MovieSectionModel.findOne({ id: sectionId }).lean();
    if (!item) {
      throw notFound(`Movie section not found: ${id}`);
    }

    return stripMongoId(item);
  }

  async create(data) {
    const rest = { ...(data || {}) };
    if (rest.id) {
      rest.id = String(rest.id).trim();
    }

    const item = new MovieSectionModel(rest);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new MovieSectionService();
