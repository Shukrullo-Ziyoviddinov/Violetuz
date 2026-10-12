/**
 * Hali tinglamagan janr / bo'lim.
 * Faqat albom katalogi va albom eshitish progressi. Boshqa manbalarni chaqirmaydi.
 *
 * @module album-home-feed/sources/exploration.source
 */

'use strict';

const { albumHomeFeedWeights } = require('../config/albumHomeFeedWeights');
const { listListenProgress } = require('../repositories/listenProgress.read');
const {
  findCatalogAlbums,
  findCatalogAlbumsByIds,
} = require('../repositories/catalog.read');

/**
 * @param {unknown} genre
 * @returns {string[]}
 */
const genreNames = (genre) =>
  String(genre || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

/**
 * @param {string[]} genres
 * @param {Set<string>} seenGenres
 * @returns {boolean}
 */
const hasUnseenGenre = (genres, seenGenres) =>
  genres.some((genre) => genre && !seenGenres.has(genre));

/**
 * @param {string|import('mongoose').Types.ObjectId|null} userId
 * @param {{ listenedIds?: Set<string> }} [options] — mehmon: DB progress o'rniga localHistory
 * @returns {Promise<Array<{ contentId: string, category: string, sourceType: 'exploration', rawScore: number }>>}
 */
const listExplorationSource = async (userId, options = {}) => {
  const cfg = albumHomeFeedWeights.exploration || {};
  const maxPerCategory = Math.max(1, cfg.maxPerCategory ?? 2);
  const limit = albumHomeFeedWeights.candidateLimits.exploration;

  let listenedIds;
  if (options.listenedIds instanceof Set) {
    listenedIds = options.listenedIds;
  } else {
    const progress = await listListenProgress(userId);
    listenedIds = new Set(
      progress.filter((row) => row.listened).map((row) => row.contentId)
    );
  }

  const listenedAlbums = await findCatalogAlbumsByIds([...listenedIds]);
  const seenGenres = new Set();
  const seenCategories = new Set();
  for (const album of listenedAlbums) {
    const category = String(album.categoryNameMusic || '').trim();
    if (category) seenCategories.add(category);
    for (const genre of genreNames(album.genre)) {
      seenGenres.add(genre);
    }
  }

  const rows = await findCatalogAlbums({}, 400, { year: -1, id: -1 });

  /** @type {Map<string, number>} */
  const perCategory = new Map();
  /** @type {Array<{ contentId: string, category: string, sourceType: 'exploration', rawScore: number }>} */
  const picked = [];

  const ordered = [...rows].sort((a, b) => {
    const yearDiff = (Number(b.year) || 0) - (Number(a.year) || 0);
    if (yearDiff !== 0) return yearDiff;
    return String(b.id).localeCompare(String(a.id));
  });

  for (const row of ordered) {
    if (picked.length >= limit) break;
    const contentId = String(row.id ?? '').trim();
    const category = String(row.categoryNameMusic || '').trim();
    if (!contentId || !category) continue;
    if (listenedIds.has(contentId)) continue;

    const genres = genreNames(row.genre);
    const unseenGenre = hasUnseenGenre(genres, seenGenres);
    const unseenCategory = !seenCategories.has(category);
    const coldStart = seenGenres.size === 0 && seenCategories.size === 0;
    if (!coldStart && !unseenGenre && !unseenCategory) continue;

    const used = perCategory.get(category) || 0;
    if (used >= maxPerCategory) continue;
    perCategory.set(category, used + 1);

    const year = Number(row.year);
    picked.push({
      contentId,
      category,
      sourceType: 'exploration',
      rawScore: Number.isFinite(year) && year > 0 ? year : 0,
    });
  }

  return picked;
};

module.exports = {
  listExplorationSource,
};
