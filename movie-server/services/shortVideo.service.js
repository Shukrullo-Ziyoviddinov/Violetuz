const ShortVideoModel = require('../models/ShortVideo.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class ShortVideoService {
  async getAll(filters = {}) {
    const query = {};

    if (filters.movieId != null) {
      query.movieId = Number(filters.movieId);
    }

    if (filters.type) {
      query.type = String(filters.type).trim();
    }

    const items = await ShortVideoModel.find(query).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid short id: ${id}`);
    }

    const item = await ShortVideoModel.findOne({ id: numericId }).lean();
    if (!item) {
      throw notFound(`Short not found: ${id}`);
    }

    return stripMongoId(item);
  }

  async getByMovieId(movieId) {
    const numericId = Number(movieId);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid movie id: ${movieId}`);
    }

    const items = await ShortVideoModel.find({ movieId: numericId }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async create(data) {
    const { id: _oldId, ...rest } = data || {};
    if (rest.type) {
      rest.type = String(rest.type).trim();
    }

    const item = new ShortVideoModel(rest);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new ShortVideoService();
