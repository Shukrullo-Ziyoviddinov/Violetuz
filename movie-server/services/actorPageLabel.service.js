const ActorPageLabelModel = require('../models/ActorPageLabel.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class ActorPageLabelService {
  async getAll() {
    const items = await ActorPageLabelModel.find({}).sort({ sortOrder: 1, id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const labelId = String(id || '').trim();
    if (!labelId) {
      throw badRequest(`Invalid actor page label id: ${id}`);
    }

    const item = await ActorPageLabelModel.findOne({ id: labelId }).lean();
    if (!item) {
      throw notFound(`Actor page label not found: ${id}`);
    }

    return stripMongoId(item);
  }

  async create(data) {
    const rest = { ...(data || {}) };
    if (rest.id) {
      rest.id = String(rest.id).trim();
    }

    const item = new ActorPageLabelModel(rest);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new ActorPageLabelService();
