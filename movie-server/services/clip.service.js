const ClipModel = require('../models/Clip.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class ClipService {
  async getAll(filters = {}) {
    const query = {};

    if (filters.categoryNameMusic) {
      query.categoryNameMusic = filters.categoryNameMusic;
    }

    if (filters.artistId) {
      query.artistId = filters.artistId;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.search) {
      const escaped = String(filters.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (escaped) {
        query.$or = [
          { title: { $regex: escaped, $options: 'i' } },
          { genre: { $regex: escaped, $options: 'i' } },
          { artistId: { $regex: escaped, $options: 'i' } },
        ];
      }
    }

    const items = await ClipModel.find(query).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid clip id: ${id}`);
    }

    const clip = await ClipModel.findOne({ id: numericId }).lean();
    if (!clip) {
      throw notFound(`Clip not found: ${id}`);
    }

    return stripMongoId(clip);
  }

  async getByCategory(categoryNameMusic) {
    const items = await ClipModel.find({ categoryNameMusic }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getByArtist(artistId) {
    const items = await ClipModel.find({ artistId }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async create(clipData) {
    const { id: _oldId, ...rest } = clipData || {};
    if (rest.categoryNameMusic) {
      rest.categoryNameMusic = String(rest.categoryNameMusic).trim();
    }
    if (rest.type) {
      rest.type = String(rest.type).trim();
    }

    const clip = new ClipModel(rest);
    await clip.save();
    return stripMongoId(clip);
  }
}

module.exports = new ClipService();
