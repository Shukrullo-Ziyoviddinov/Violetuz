const MusicModel = require('../models/Music.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class MusicService {
  async getAll(filters = {}) {
    const query = {};

    if (filters.categoryNameMusic) {
      query.categoryNameMusic = filters.categoryNameMusic;
    }

    if (filters.artistId) {
      query.artistId = filters.artistId;
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

    const items = await MusicModel.find(query).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid music id: ${id}`);
    }

    const music = await MusicModel.findOne({ id: numericId }).lean();
    if (!music) {
      throw notFound(`Music not found: ${id}`);
    }

    return stripMongoId(music);
  }

  async getByCategory(categoryNameMusic) {
    const items = await MusicModel.find({ categoryNameMusic }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getByArtist(artistId) {
    const items = await MusicModel.find({ artistId }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async create(musicData) {
    const { id: _oldId, ...rest } = musicData || {};
    if (rest.categoryNameMusic) {
      rest.categoryNameMusic = String(rest.categoryNameMusic).trim();
    }

    const music = new MusicModel(rest);
    await music.save();
    return stripMongoId(music);
  }
}

module.exports = new MusicService();
