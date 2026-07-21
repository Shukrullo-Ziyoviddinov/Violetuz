const MusicShortModel = require('../models/MusicShort.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

const normalizeContentType = (contentType) => {
  if (contentType == null) return null;
  const normalized = String(contentType).trim().toLowerCase();
  if (!['music', 'klip', 'konsert'].includes(normalized)) {
    throw badRequest('contentType must be music, klip, or konsert');
  }
  return normalized;
};

class MusicShortService {
  async getAll(filters = {}) {
    const query = {};

    if (filters.contentType != null) {
      query.contentType = normalizeContentType(filters.contentType);
    }

    if (filters.artistId != null) {
      const artistId = String(filters.artistId).trim();
      if (!artistId) {
        throw badRequest(`Invalid artistId: ${filters.artistId}`);
      }
      query.artistId = artistId;
    }

    if (filters.musicId != null) {
      const numericId = Number(filters.musicId);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        throw badRequest(`Invalid musicId: ${filters.musicId}`);
      }
      query.musicId = numericId;
    }

    if (filters.movieId != null) {
      const numericId = Number(filters.movieId);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        throw badRequest(`Invalid movieId: ${filters.movieId}`);
      }
      query.movieId = numericId;
    }

    const items = await MusicShortModel.find(query).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid music short id: ${id}`);
    }

    const item = await MusicShortModel.findOne({ id: numericId }).lean();
    if (!item) {
      throw notFound(`Music short not found: ${id}`);
    }

    return stripMongoId(item);
  }

  async getByArtistId(artistId) {
    const id = String(artistId || '').trim();
    if (!id) {
      throw badRequest(`Invalid artistId: ${artistId}`);
    }

    const items = await MusicShortModel.find({ artistId: id }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async create(data) {
    const rest = { ...(data || {}) };
    if (rest.contentType) {
      rest.contentType = normalizeContentType(rest.contentType);
    }
    if (rest.type) {
      rest.type = String(rest.type).trim();
    } else {
      rest.type = 'musicshorts';
    }
    if (rest.artistId) {
      rest.artistId = String(rest.artistId).trim();
    }

    const item = new MusicShortModel(rest);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new MusicShortService();
