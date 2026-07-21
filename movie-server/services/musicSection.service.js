const MusicSectionModel = require('../models/MusicSection.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class MusicSectionService {
  async getAll() {
    const items = await MusicSectionModel.find({}).sort({ sortOrder: 1, id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const sectionId = String(id || '').trim();
    if (!sectionId) {
      throw badRequest(`Invalid music section id: ${id}`);
    }

    const item = await MusicSectionModel.findOne({ id: sectionId }).lean();
    if (!item) {
      throw notFound(`Music section not found: ${id}`);
    }

    return stripMongoId(item);
  }

  async create(data) {
    const rest = { ...(data || {}) };
    if (rest.id) {
      rest.id = String(rest.id).trim();
    }

    const item = new MusicSectionModel(rest);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new MusicSectionService();
