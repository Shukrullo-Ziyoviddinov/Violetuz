const MusicBannerModel = require('../models/MusicBanner.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class MusicBannerService {
  async getAll() {
    const items = await MusicBannerModel.find({}).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid music banner id: ${id}`);
    }

    const item = await MusicBannerModel.findOne({ id: numericId }).lean();
    if (!item) {
      throw notFound(`Music banner not found: ${id}`);
    }

    return stripMongoId(item);
  }

  async create(data) {
    const rest = { ...(data || {}) };
    const item = new MusicBannerModel(rest);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new MusicBannerService();
