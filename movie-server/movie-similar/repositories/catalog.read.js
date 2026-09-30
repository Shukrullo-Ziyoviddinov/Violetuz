/**
 * Kino katalogi — faqat o'qish (movie-similar ichida).
 * Collection: movies. recommendation / home-feed catalog helperlariga ulanmaydi.
 *
 * @module movie-similar/repositories/catalog.read
 */

'use strict';

const Movie = require('../../models/Movie.model');
const { similarityWeights } = require('../config/similarityWeights');

const franchiseField = similarityWeights.franchiseField;

/** Engine + cache hydrate uchun kerakli maydonlar. */
const SIMILAR_CATALOG_SELECT = Object.freeze({
  _id: 0,
  id: 1,
  title: 1,
  homeImg: 1,
  genre: 1,
  filterGenre: 1,
  actors: 1,
  category: 1,
  categoryName: 1,
  typeCategory: 1,
  filterCountry: 1,
  specs: 1,
  description: 1,
  rating: 1,
  ageRestriction: 1,
  [franchiseField]: 1,
});

/**
 * @param {unknown} value
 * @returns {number|null}
 */
const toMovieId = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * @param {Array<string|number>} ids
 * @returns {number[]}
 */
const uniqueMovieIds = (ids) => [
  ...new Set(
    (ids || [])
      .map((id) => toMovieId(id))
      .filter((id) => id != null)
  ),
];

/**
 * Bitta kino (engine / API).
 * @param {string|number} movieId
 * @returns {Promise<object|null>}
 */
const findCatalogMovieById = async (movieId) => {
  const id = toMovieId(movieId);
  if (id == null) return null;
  return Movie.findOne({ id }).select(SIMILAR_CATALOG_SELECT).lean();
};

/**
 * Barcha katalog — precompute uchun.
 * @returns {Promise<object[]>}
 */
const listAllCatalogMovies = async () =>
  Movie.find({}).select(SIMILAR_CATALOG_SELECT).lean();

/**
 * Id ro'yxati bo'yicha (cache hydrate).
 * @param {Array<string|number>} movieIds
 * @returns {Promise<object[]>}
 */
const findCatalogMoviesByIds = async (movieIds) => {
  const ids = uniqueMovieIds(movieIds);
  if (!ids.length) return [];
  const rows = await Movie.find({ id: { $in: ids } })
    .select(SIMILAR_CATALOG_SELECT)
    .lean();
  const byId = new Map(rows.map((row) => [Number(row.id), row]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
};

/**
 * QATLAM 3 kandidat pool (ixtiyoriy category filter).
 * @param {{ category?: string, excludeIds?: Array<string|number> }} [opts]
 * @returns {Promise<object[]>}
 */
const listCandidatePool = async (opts = {}) => {
  const filter = {};
  const category = String(opts.category || '').trim();
  if (category) {
    filter.category = category;
  }

  const exclude = uniqueMovieIds(opts.excludeIds);
  if (exclude.length) {
    filter.id = { $nin: exclude };
  }

  return Movie.find(filter).select(SIMILAR_CATALOG_SELECT).lean();
};

module.exports = {
  SIMILAR_CATALOG_SELECT,
  findCatalogMovieById,
  listAllCatalogMovies,
  findCatalogMoviesByIds,
  listCandidatePool,
  uniqueMovieIds,
  toMovieId,
};
