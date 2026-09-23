/**
 * Katalogdan yengil o'qish. home-feed modellari va bo'lim algoritmiga yozilmaydi.
 *
 * @module home-feed/sources/catalog.read
 */

'use strict';

const Movie = require('../../models/Movie.model');
const { toStringList } = require('../../recommendation/utils/values');
const { excludedCategories } = require('../repositories/excludedCategory');

const CATALOG_SELECT = Object.freeze({
  _id: 0,
  id: 1,
  categoryName: 1,
  filterGenre: 1,
  rating: 1,
  createdAt: 1,
});

/**
 * @returns {Object}
 */
const catalogCategoryMatch = () => {
  const names = excludedCategories();
  if (!names.length) return {};
  return { categoryName: { $nin: names } };
};

/**
 * @param {Object} filter
 * @param {number} [limit]
 * @returns {Promise<Object[]>}
 */
const findCatalogMovies = async (filter, limit = 200, sort = { rating: -1, createdAt: -1 }) => {
  const rows = await Movie.find({ ...catalogCategoryMatch(), ...filter })
    .select(CATALOG_SELECT)
    .sort(sort)
    .limit(Math.max(1, limit))
    .lean();
  return rows || [];
};

/**
 * @param {Array<string|number>} movieIds
 * @returns {Promise<Object[]>}
 */
const findCatalogMoviesByIds = async (movieIds) => {
  const ids = [
    ...new Set(
      (movieIds || [])
        .map((id) => Number(String(id).trim()))
        .filter((id) => Number.isInteger(id))
    ),
  ];
  if (!ids.length) return [];

  const rows = await Movie.find({ id: { $in: ids } })
    .select(CATALOG_SELECT)
    .lean();
  return rows || [];
};

/**
 * Tartib/diversity uchun category va aktyor. anonslar va eski movies tushadi.
 *
 * @param {Array<string|number>} movieIds
 * @returns {Promise<Map<string, { category: string, actors: string[] }>>}
 */
const findRankMetaByIds = async (movieIds) => {
  const ids = [
    ...new Set(
      (movieIds || [])
        .map((id) => Number(String(id).trim()))
        .filter((id) => Number.isInteger(id))
    ),
  ];
  /** @type {Map<string, { category: string, actors: string[] }>} */
  const map = new Map();
  if (!ids.length) return map;

  const rows = await Movie.find({ id: { $in: ids }, ...catalogCategoryMatch() })
    .select({ _id: 0, id: 1, categoryName: 1, actors: 1 })
    .lean();

  for (const row of rows || []) {
    const movieId = String(row.id ?? '').trim();
    const category = String(row.categoryName || '').trim();
    if (!movieId || !category) continue;
    map.set(movieId, {
      category,
      actors: toStringList(row.actors),
    });
  }
  return map;
};

module.exports = {
  catalogCategoryMatch,
  findCatalogMovies,
  findCatalogMoviesByIds,
  findRankMetaByIds,
};
