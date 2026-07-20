const AlbumModel = require('../models/Album.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class AlbumService {
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
          { artist: { $regex: escaped, $options: 'i' } },
          { genre: { $regex: escaped, $options: 'i' } },
          { artistId: { $regex: escaped, $options: 'i' } },
        ];
      }
    }

    const items = await AlbumModel.find(query).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid album id: ${id}`);
    }

    const album = await AlbumModel.findOne({ id: numericId }).lean();
    if (!album) {
      throw notFound(`Album not found: ${id}`);
    }

    return stripMongoId(album);
  }

  async getByCategory(categoryNameMusic) {
    const items = await AlbumModel.find({ categoryNameMusic }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getByArtist(artistId) {
    const items = await AlbumModel.find({ artistId }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async create(albumData) {
    const { id: _oldId, ...rest } = albumData || {};
    if (rest.categoryNameMusic) {
      rest.categoryNameMusic = String(rest.categoryNameMusic).trim();
    }

    const album = new AlbumModel(rest);
    await album.save();
    return stripMongoId(album);
  }
}

module.exports = new AlbumService();
