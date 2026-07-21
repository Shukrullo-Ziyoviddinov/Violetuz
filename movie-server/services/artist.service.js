const ArtistModel = require('../models/Artist.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class ArtistService {
  async getAll() {
    const items = await ArtistModel.find({}).sort({ name: 1, id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const artistId = String(id || '').trim();
    if (!artistId) {
      throw badRequest(`Invalid artist id: ${id}`);
    }

    const item = await ArtistModel.findOne({ id: artistId }).lean();
    if (!item) {
      throw notFound(`Artist not found: ${id}`);
    }

    return stripMongoId(item);
  }

  async create(data) {
    const rest = { ...(data || {}) };
    if (rest.id) {
      rest.id = String(rest.id).trim();
    }
    if (!rest.id) {
      throw badRequest('Artist id is required');
    }
    if (!rest.name) {
      throw badRequest('Artist name is required');
    }

    const item = new ArtistModel(rest);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new ArtistService();
