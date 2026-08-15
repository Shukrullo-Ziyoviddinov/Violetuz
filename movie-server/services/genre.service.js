const GenreModel = require('../models/Genre.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class GenreService {
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

    const items = await GenreModel.find(query).sort({ sortOrder: 1, id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const genreId = String(id || '').trim();
    if (!genreId) {
      throw badRequest(`Invalid genre id: ${id}`);
    }

    const item = await GenreModel.findOne({ id: genreId }).lean();
    if (!item) {
      throw notFound(`Genre not found: ${id}`);
    }

    return stripMongoId(item);
  }

  async create(data) {
    const rest = { ...(data || {}) };
    if (rest.id) {
      rest.id = String(rest.id).trim();
    }

    const item = new GenreModel(rest);
    await item.save();
    return stripMongoId(item);
  }

  async update(id, data) {
    const genreId = String(id || '').trim();
    if (!genreId) {
      throw badRequest(`Invalid genre id: ${id}`);
    }

    const item = await GenreModel.findOne({ id: genreId });
    if (!item) {
      throw notFound(`Genre not found: ${id}`);
    }

    const patch = { ...(data || {}) };
    delete patch.id;

    if (patch.title !== undefined) item.title = patch.title;
    if (patch.img !== undefined) item.img = patch.img;
    if (patch.filterGenre !== undefined) item.filterGenre = patch.filterGenre;
    if (patch.sortOrder !== undefined) item.sortOrder = Number(patch.sortOrder) || 0;

    await item.save();
    return stripMongoId(item);
  }

  async remove(id) {
    const genreId = String(id || '').trim();
    if (!genreId) {
      throw badRequest(`Invalid genre id: ${id}`);
    }

    const item = await GenreModel.findOneAndDelete({ id: genreId }).lean();
    if (!item) {
      throw notFound(`Genre not found: ${id}`);
    }

    return stripMongoId(item);
  }
}

module.exports = new GenreService();
