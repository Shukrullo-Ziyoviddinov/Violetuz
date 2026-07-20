const ArtistMusicStoryModel = require('../models/ArtistMusicStory.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class ArtistMusicStoryService {
  async getAll(filters = {}) {
    const query = {};

    if (filters.artistId) {
      query.artistId = filters.artistId;
    }

    if (filters.search) {
      const escaped = String(filters.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (escaped) {
        query.$or = [
          { title: { $regex: escaped, $options: 'i' } },
          { artistId: { $regex: escaped, $options: 'i' } },
        ];
      }
    }

    const items = await ArtistMusicStoryModel.find(query).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid artist music story id: ${id}`);
    }

    const item = await ArtistMusicStoryModel.findOne({ id: numericId }).lean();
    if (!item) {
      throw notFound(`Artist music story not found: ${id}`);
    }

    return stripMongoId(item);
  }

  async getByArtist(artistId) {
    const items = await ArtistMusicStoryModel.find({ artistId }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async create(data) {
    const { id: _oldId, ...rest } = data || {};
    if (rest.artistId) {
      rest.artistId = String(rest.artistId).trim();
    }

    const item = new ArtistMusicStoryModel(rest);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new ArtistMusicStoryService();
