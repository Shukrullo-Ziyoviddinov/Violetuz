const MovieModel = require('../models/Movie.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

class MovieService {
  async getAll(filters = {}) {
    const query = {};

    if (filters.categoryName) {
      query.categoryName = filters.categoryName;
    }

    if (filters.search) {
      const escaped = String(filters.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (escaped) {
        query.$or = [
          { 'title.uz': { $regex: escaped, $options: 'i' } },
          { 'title.ru': { $regex: escaped, $options: 'i' } },
        ];
      }
    }

    const movies = await MovieModel.find(query).sort({ id: 1 }).lean();

    return movies.map(stripMongoId);
  }

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid movie id: ${id}`);
    }

    const movie = await MovieModel.findOne({ id: numericId }).lean();

    if (!movie) {
      throw notFound(`Movie not found: ${id}`);
    }

    return stripMongoId(movie);
  }

  async getByCategory(categoryName) {
    const movies = await MovieModel.find({ categoryName }).sort({ id: 1 }).lean();
    return movies.map(stripMongoId);
  }

  async create(movieData) {
    const { id: _oldId, ...rest } = movieData || {};
    const movie = new MovieModel(rest);
    await movie.save();
    return stripMongoId(movie);
  }
}

module.exports = new MovieService();
