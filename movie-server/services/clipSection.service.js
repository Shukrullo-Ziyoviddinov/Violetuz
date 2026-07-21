const ClipSectionModel = require('../models/ClipSection.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class ClipSectionService {
  async getAll() {
    const items = await ClipSectionModel.find({}).sort({ sortOrder: 1, id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const sectionId = String(id || '').trim();
    if (!sectionId) {
      throw badRequest(`Invalid clip section id: ${id}`);
    }

    const item = await ClipSectionModel.findOne({ id: sectionId }).lean();
    if (!item) {
      throw notFound(`Clip section not found: ${id}`);
    }

    return stripMongoId(item);
  }

  async create(data) {
    const rest = { ...(data || {}) };
    if (rest.id) {
      rest.id = String(rest.id).trim();
    }

    const item = new ClipSectionModel(rest);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new ClipSectionService();
