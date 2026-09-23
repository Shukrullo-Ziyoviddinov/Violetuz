/**
 * Hali ko'rilmagan janr / bo'lim.
 * Faqat katalog va ko'rish progressi. Boshqa manbalarni chaqirmaydi.
 *
 * @module home-feed/sources/exploration.source
 */

'use strict';

const { homeFeedWeights } = require('../config/homeFeedWeights');
const { listWatchProgress } = require('../repositories/watchProgress.read');
const { isExcludedCategory } = require('../repositories/excludedCategory');
const { findCatalogMovies, findCatalogMoviesByIds } = require('./catalog.read');

/**
 * @param {string[]} genres
 * @param {Set<string>} seenGenres
 * @returns {boolean}
 */
const hasUnseenGenre = (genres, seenGenres) =>
  genres.some((genre) => genre && !seenGenres.has(genre));

/**
 * @param {string|import('mongoose').Types.ObjectId|null} userId
 * @param {{ watchedIds?: Set<string> }} [options] — mehmon: DB progress o'rniga localHistory
 * @returns {Promise<Array<{ movieId: string, category: string, sourceType: 'exploration', rawScore: number }>>}
 */
const listExplorationSource = async (userId, options = {}) => {
  const cfg = homeFeedWeights.exploration || {};
  const minRating = cfg.minRating ?? 4.7;
  const maxPerCategory = Math.max(1, cfg.maxPerCategory ?? 2);
  const limit = homeFeedWeights.candidateLimits.exploration;

  let watchedIds;
  if (options.watchedIds instanceof Set) {
    watchedIds = options.watchedIds;
  } else {
    const progress = await listWatchProgress(userId);
    const watched = progress.filter((row) => row.watched);
    watchedIds = new Set(watched.map((row) => row.movieId));
  }

  const watchedMovies = await findCatalogMoviesByIds([...watchedIds]);
  const seenGenres = new Set();
  const seenCategories = new Set();
  for (const movie of watchedMovies) {
    const category = String(movie.categoryName || '').trim();
    if (category) seenCategories.add(category);
    for (const genre of movie.filterGenre || []) {
      const name = String(genre || '').trim();
      if (name) seenGenres.add(name);
    }
  }

  const rows = await findCatalogMovies(
    { rating: { $gte: minRating } },
    400
  );

  /** @type {Map<string, number>} */
  const perCategory = new Map();
  /** @type {Array<{ movieId: string, category: string, sourceType: 'exploration', rawScore: number }>} */
  const picked = [];

  const ordered = [...rows].sort((a, b) => {
    const ratingDiff = (Number(b.rating) || 0) - (Number(a.rating) || 0);
    if (ratingDiff !== 0) return ratingDiff;
    return String(b.id).localeCompare(String(a.id));
  });

  for (const row of ordered) {
    if (picked.length >= limit) break;
    const movieId = String(row.id ?? '').trim();
    const category = String(row.categoryName || '').trim();
    if (!movieId || !category || isExcludedCategory(category)) continue;
    if (watchedIds.has(movieId)) continue;

    const genres = (row.filterGenre || [])
      .map((genre) => String(genre || '').trim())
      .filter(Boolean);
    const unseenGenre = hasUnseenGenre(genres, seenGenres);
    const unseenCategory = !seenCategories.has(category);
    const coldStart = seenGenres.size === 0 && seenCategories.size === 0;
    if (!coldStart && !unseenGenre && !unseenCategory) continue;

    const used = perCategory.get(category) || 0;
    if (used >= maxPerCategory) continue;
    perCategory.set(category, used + 1);

    picked.push({
      movieId,
      category,
      sourceType: 'exploration',
      rawScore: Math.min(1, (Number(row.rating) || 0) / 5),
    });
  }

  return picked;
};

module.exports = {
  listExplorationSource,
};
