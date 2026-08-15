const BannerModel = require('../models/Banner.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class BannerService {
  async getAll(filters = {}) {
    const query = {};

    if (filters.lang) {
      query.lang = filters.lang;
    }

    if (filters.movieId != null) {
      query.movieId = Number(filters.movieId);
    }

    const items = await BannerModel.find(query).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid banner id: ${id}`);
    }

    const item = await BannerModel.findOne({ id: numericId }).lean();
    if (!item) {
      throw notFound(`Banner not found: ${id}`);
    }

    return stripMongoId(item);
  }

  async getByLang(lang) {
    const items = await BannerModel.find({ lang }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async create(data) {
    const { id: _oldId, ...rest } = data || {};
    if (rest.lang) {
      rest.lang = String(rest.lang).trim();
    }

    const item = new BannerModel(rest);
    await item.save();
    return stripMongoId(item);
  }

  async update(id, data) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid banner id: ${id}`);
    }

    const item = await BannerModel.findOne({ id: numericId });
    if (!item) {
      throw notFound(`Banner not found: ${id}`);
    }

    const patch = { ...(data || {}) };
    delete patch.id;

    if (patch.lang !== undefined) item.lang = String(patch.lang).trim();
    if (patch.movieId !== undefined) item.movieId = Number(patch.movieId);
    if (patch.image !== undefined) item.image = patch.image;
    if (patch.video !== undefined) item.video = patch.video;

    await item.save();
    return stripMongoId(item);
  }

  async remove(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid banner id: ${id}`);
    }

    const item = await BannerModel.findOneAndDelete({ id: numericId }).lean();
    if (!item) {
      throw notFound(`Banner not found: ${id}`);
    }

    return stripMongoId(item);
  }
}

module.exports = new BannerService();
