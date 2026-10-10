/**
 * Movie detail "Siz uchun" sahifasi.
 * Janrlar butun lentadan yig'iladi. Tanlangan janr bo'yicha kesiladi.
 * Home to'liq javobiga tegmaydi.
 *
 * @module home-feed/services/feedPage
 */

'use strict';

const { findCatalogMoviesByIds } = require('../sources/catalog.read');

const MAX_PAGE = 40;

/**
 * @param {unknown} value
 * @returns {string[]}
 */
const genresOf = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (value != null && String(value).trim()) return [String(value).trim()];
  return [];
};

/**
 * @param {Array<{ movieId: string }>} movies
 * @param {{ offset?: number, limit?: number, excludeIds?: string[], genre?: string }} [page]
 * @returns {Promise<{ movies: Object[], hasMore: boolean, genres: string[] }>}
 */
const sliceFeedPage = async (movies, { offset = 0, limit = 10, excludeIds = [], genre = '' } = {}) => {
  const exclude = new Set(
    (Array.isArray(excludeIds) ? excludeIds : []).map((id) => String(id).trim()).filter(Boolean)
  );
  const ordered = (Array.isArray(movies) ? movies : []).filter(
    (row) => row?.movieId != null && !exclude.has(String(row.movieId))
  );

  const catalog = await findCatalogMoviesByIds(ordered.map((row) => row.movieId));
  const genreById = new Map();
  for (const row of catalog) {
    const movieId = String(row?.id ?? '').trim();
    if (!movieId) continue;
    genreById.set(movieId, genresOf(row.filterGenre));
  }

  const genres = [];
  const seen = new Set();
  for (const row of ordered) {
    for (const name of genreById.get(String(row.movieId)) || []) {
      if (seen.has(name)) continue;
      seen.add(name);
      genres.push(name);
    }
  }

  const selected = String(genre || '').trim();
  const matched = !selected || selected === 'all'
    ? ordered
    : ordered.filter((row) => (genreById.get(String(row.movieId)) || []).includes(selected));

  const skip = Math.max(0, Number(offset) || 0);
  const take = Math.min(MAX_PAGE, Math.max(1, Number(limit) || 10));
  const pageMovies = matched.slice(skip, skip + take);

  return {
    movies: pageMovies,
    hasMore: skip + pageMovies.length < matched.length,
    genres,
  };
};

module.exports = {
  sliceFeedPage,
};
