/**
 * Hydrate cached movie ids preserving recommendation order.
 *
 * @module recommendation/repositories/movieProjection.repository
 */

'use strict';

const Movie = require('../../models/Movie.model');

const SCORE_PROJECTION = Object.freeze({
  _id: 0,
  id: 1,
  categoryName: 1,
  filterGenre: 1,
  filterCountry: 1,
  actors: 1,
  rating: 1,
  ratingImdb: 1,
  ratingKinopoisk: 1,
  like: 1,
  'specs.year': 1,
});

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
};

/**
 * @param {string|number} movieId
 * @returns {Promise<import('../types/recommendation.types').Movie|null>}
 */
const findMovieProjectionById = async (movieId) => {
  const idStr = String(movieId ?? '').trim();
  if (!idStr) return null;

  const numericId = Number(idStr);
  const useNumeric = Number.isInteger(numericId) && String(numericId) === idStr;
  if (!useNumeric) return null;

  const doc = await Movie.findOne({ id: numericId }).select(SCORE_PROJECTION).lean();
  if (!doc) return null;

  return {
    ...doc,
    releaseYear: doc.specs?.year ?? null,
  };
};

/**
 * Lightweight category candidate pool (id + affinity fields + popularity signals).
 * Sorted numerically before limit so large categories keep popular/recent titles
 * (like is stored as string — lexicographic sort would be wrong).
 * @param {string} categoryName
 * @param {number} [limit]
 * @returns {Promise<import('../types/recommendation.types').Movie[]>}
 */
const findMoviesByCategory = async (categoryName, limit = 400) => {
  const category = String(categoryName || '').trim();
  if (!category) return [];

  const docs = await Movie.aggregate([
    { $match: { categoryName: category } },
    {
      $addFields: {
        _likeNum: {
          $convert: { input: '$like', to: 'double', onError: 0, onNull: 0 },
        },
        _year: { $ifNull: ['$specs.year', 0] },
        _rating: {
          $max: [
            { $ifNull: ['$rating', 0] },
            { $ifNull: ['$ratingImdb', 0] },
            { $ifNull: ['$ratingKinopoisk', 0] },
          ],
        },
      },
    },
    // Align with cold-start signals: popularity → recency → rating
    { $sort: { _likeNum: -1, _year: -1, _rating: -1 } },
    { $limit: Math.max(1, limit) },
    {
      $project: {
        _id: 0,
        id: 1,
        categoryName: 1,
        filterGenre: 1,
        filterCountry: 1,
        actors: 1,
        rating: 1,
        ratingImdb: 1,
        ratingKinopoisk: 1,
        like: 1,
        specs: { year: '$specs.year' },
      },
    },
  ]);

  return docs.map((doc) => ({
    ...doc,
    releaseYear: doc.specs?.year ?? null,
  }));
};

/**
 * Full movie docs by ids, returned in the same order as `movieIds`.
 * @param {Array<string|number>} movieIds
 * @returns {Promise<Object[]>}
 */
const findMoviesByIdsPreserveOrder = async (movieIds) => {
  const ids = [...new Set(
    (movieIds || [])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
  )];

  if (!ids.length) return [];

  const docs = await Movie.find({ id: { $in: ids } }).lean();
  const byId = new Map(docs.map((doc) => [doc.id, stripMongoId(doc)]));

  return movieIds
    .map((id) => byId.get(Number(id)))
    .filter(Boolean);
};

module.exports = {
  SCORE_PROJECTION,
  findMovieProjectionById,
  findMoviesByCategory,
  findMoviesByIdsPreserveOrder,
};
