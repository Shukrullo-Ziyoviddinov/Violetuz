const ConcertModel = require('../models/Concert.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class ConcertService {
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

    const items = await ConcertModel.find(query).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid concert id: ${id}`);
    }

    const concert = await ConcertModel.findOne({ id: numericId }).lean();
    if (!concert) {
      throw notFound(`Concert not found: ${id}`);
    }

    return stripMongoId(concert);
  }

  async getByCategory(categoryNameMusic) {
    const items = await ConcertModel.find({ categoryNameMusic }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getByArtist(artistId) {
    const items = await ConcertModel.find({ artistId }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async create(concertData) {
    const { id: _oldId, ...rest } = concertData || {};
    if (rest.categoryNameMusic) {
      rest.categoryNameMusic = String(rest.categoryNameMusic).trim();
    }
    if (rest.type) {
      rest.type = String(rest.type).trim();
    }

    const concert = new ConcertModel(rest);
    await concert.save();
    return stripMongoId(concert);
  }
}

module.exports = new ConcertService();
