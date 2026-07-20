const VideoBannerModel = require('../models/VideoBanner.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

const normalizeType = (type) => {
  if (type == null) return null;
  const normalized = String(type).trim().toLowerCase();
  if (normalized !== 'movie' && normalized !== 'music') {
    throw badRequest('type must be movie or music');
  }
  return normalized;
};

class VideoBannerService {
  async getAll(filters = {}) {
    const query = {};

    if (filters.type != null) {
      query.type = normalizeType(filters.type);
    }

    if (filters.refId != null) {
      const numericId = Number(filters.refId);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        throw badRequest(`Invalid refId: ${filters.refId}`);
      }
      query.refId = numericId;
    }

    const items = await VideoBannerModel.find(query).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid video banner id: ${id}`);
    }

    const item = await VideoBannerModel.findOne({ id: numericId }).lean();
    if (!item) {
      throw notFound(`Video banner not found: ${id}`);
    }

    return stripMongoId(item);
  }

  async getByType(type) {
    const normalized = normalizeType(type);
    const items = await VideoBannerModel.find({ type: normalized }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async create(data) {
    const { id: _oldId, ...rest } = data || {};
    rest.type = normalizeType(rest.type);

    if (rest.refId == null) {
      throw badRequest('refId is required');
    }

    const item = new VideoBannerModel(rest);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new VideoBannerService();
