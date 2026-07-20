const ActorModel = require('../models/Actor.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class ActorService {
  async getAll(filters = {}) {
    const query = {};

    if (filters.actorsGenre) {
      query.actorsGenre = filters.actorsGenre;
    }

    if (filters.ids && Array.isArray(filters.ids) && filters.ids.length > 0) {
      query.id = { $in: filters.ids };
    }

    if (filters.search) {
      const escaped = String(filters.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (escaped) {
        query.$or = [
          { 'name.uz': { $regex: escaped, $options: 'i' } },
          { 'name.ru': { $regex: escaped, $options: 'i' } },
        ];
      }
    }

    const actors = await ActorModel.find(query).sort({ id: 1 }).lean();
    return actors.map(stripMongoId);
  }

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid actor id: ${id}`);
    }

    const actor = await ActorModel.findOne({ id: numericId }).lean();
    if (!actor) {
      throw notFound(`Actor not found: ${id}`);
    }

    return stripMongoId(actor);
  }

  async getByIds(ids = []) {
    const idList = Array.isArray(ids) ? ids : [];
    const numericIds = idList
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

    if (numericIds.length === 0) {
      return [];
    }

    const actors = await ActorModel.find({ id: { $in: numericIds } }).sort({ id: 1 }).lean();
    return actors.map(stripMongoId);
  }

  async getByGenre(actorsGenre) {
    const actors = await ActorModel.find({ actorsGenre }).sort({ id: 1 }).lean();
    return actors.map(stripMongoId);
  }

  async create(actorData) {
    const { id: _oldId, ...rest } = actorData || {};
    if (rest.actorsGenre) {
      rest.actorsGenre = String(rest.actorsGenre).trim();
    }

    const actor = new ActorModel(rest);
    await actor.save();
    return stripMongoId(actor);
  }
}

module.exports = new ActorService();
