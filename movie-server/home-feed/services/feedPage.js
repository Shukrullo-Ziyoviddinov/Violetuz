/**
 * Tayyor "Siz uchun" lentasidan sahifa.
 * Id tartibi o'zgarmaydi. Karta maydonlari faqat shu offset/limit kesimidan o'qiladi.
 * Janr ro'yxati butun lenta bo'yicha qoladi — kino sahifasi shuni ishlatadi.
 *
 * @module home-feed/services/feedPage
 */

'use strict';

const {
  findFeedPageGenresByIds,
  findFeedPageCardsByIds,
} = require('../sources/catalog.read');

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
 * @param {unknown} value
 * @returns {Object}
 */
const localized = (value) => (
  value && typeof value === 'object' && !Array.isArray(value) ? value : {}
);

/**
 * @param {Object} row
 * @returns {Object}
 */
const toFeedPageCard = (row) => {
  const id = row.id;
  const countries = Array.isArray(row.specs?.countries)
    ? row.specs.countries.map((item) => String(item).trim()).filter(Boolean)
    : [];
  return {
    movieId: String(id),
    id,
    title: localized(row.title),
    homeImg: localized(row.homeImg),
    category: row.category != null ? String(row.category) : '',
    rating: row.rating ?? null,
    ageRestriction: row.ageRestriction ?? null,
    specs: {
      year: row.specs?.year ?? null,
      countries,
    },
    filterGenre: genresOf(row.filterGenre),
  };
};

/**
 * @param {Array<{ movieId: string }>} movies
 * @param {{ offset?: number, limit?: number, excludeIds?: string[], genre?: string }} [page]
 * @param {{ findFeedPageGenresByIds?: Function, findFeedPageCardsByIds?: Function }} [readers]
 * @returns {Promise<{ movies: Object[], hasMore: boolean, nextOffset: number, genres: string[] }>}
 */
const sliceFeedPage = async (movies, { offset = 0, limit = 10, excludeIds = [], genre = '' } = {}, readers = {}) => {
  const loadGenres = readers.findFeedPageGenresByIds || findFeedPageGenresByIds;
  const loadCards = readers.findFeedPageCardsByIds || findFeedPageCardsByIds;
  const exclude = new Set(
    (Array.isArray(excludeIds) ? excludeIds : []).map((id) => String(id).trim()).filter(Boolean)
  );
  const ordered = (Array.isArray(movies) ? movies : []).filter(
    (row) => row?.movieId != null && !exclude.has(String(row.movieId))
  );

  const genreRows = await loadGenres(ordered.map((row) => row.movieId));
  const genreById = new Map();
  for (const row of genreRows) {
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
  const pageRows = matched.slice(skip, skip + take);
  const cardRows = await loadCards(pageRows.map((row) => row.movieId));
  const cardById = new Map();
  for (const row of cardRows) {
    const movieId = String(row?.id ?? '').trim();
    if (!movieId) continue;
    cardById.set(movieId, toFeedPageCard(row));
  }

  const pageMovies = pageRows.map((row) => {
    const movieId = String(row.movieId);
    return cardById.get(movieId) || { movieId };
  });
  const nextOffset = skip + pageRows.length;

  return {
    movies: pageMovies,
    hasMore: nextOffset < matched.length,
    nextOffset,
    genres,
  };
};

module.exports = {
  sliceFeedPage,
};
