const AdModel = require('../models/Ad.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class AdService {
  async getAll(filters = {}) {
    const query = {};

    if (filters.isActive != null) {
      query.isActive = filters.isActive === true || filters.isActive === 'true';
    }

    const items = await AdModel.find(query).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid ad id: ${id}`);
    }

    const item = await AdModel.findOne({ id: numericId }).lean();
    if (!item) {
      throw notFound(`Ad not found: ${id}`);
    }

    return stripMongoId(item);
  }

  async getActive() {
    const items = await AdModel.find({ isActive: true }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async create(data) {
    const { id: _oldId, ...rest } = data || {};
    const item = new AdModel(rest);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new AdService();
