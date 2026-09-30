/**
 * UCH QATLAMLI "shunga o'xshash" yig'ish.
 * Tartib qat'iy aralashmaydi: franchise → name_genre → general.
 *
 * User / login / guest ga bog'liq emas.
 * recommendation / home-feed / scoring ga ulanmaydi.
 * Cache yozish — repository/job (keyingi qadamlar).
 *
 * @module movie-similar/services/similarMoviesEngine
 */

'use strict';

const { similarityWeights } = require('../config/similarityWeights');
const {
  localizedTitleOverlapScore,
} = require('./titleSimilarityMatcher');

const LAYERS = similarityWeights.layers;

/**
 * @param {unknown} value
 * @returns {number|null}
 */
const toMovieId = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * @param {unknown} movie
 * @returns {number|null}
 */
const movieIdOf = (movie) => toMovieId(movie?.id);

/**
 * Janrlar — faqat filterGenre (katalog filter manbai).
 * @param {unknown} movie
 * @returns {string[]}
 */
const genresOf = (movie) => {
  const out = new Set();
  if (!Array.isArray(movie?.filterGenre)) return [];
  for (const item of movie.filterGenre) {
    const g = String(item || '')
      .trim()
      .toLowerCase();
    if (g) out.add(g);
  }
  return [...out];
};

/**
 * @param {unknown} movie
 * @returns {string[]}
 */
const actorsOf = (movie) => {
  if (!Array.isArray(movie?.actors)) return [];
  return movie.actors
    .map((a) => String(a ?? '').trim().toLowerCase())
    .filter(Boolean);
};

/**
 * Davlat — faqat filterCountry.
 * @param {unknown} movie
 * @returns {string[]}
 */
const countriesOf = (movie) => {
  const c = String(movie?.filterCountry || '')
    .trim()
    .toLowerCase();
  return c ? [c] : [];
};

/**
 * @param {unknown} movie
 * @returns {number|null}
 */
const yearOf = (movie) => {
  const y = Number(movie?.specs?.year ?? movie?.description?.uz?.year ?? movie?.description?.ru?.year);
  return Number.isFinite(y) ? y : null;
};

/**
 * Director — description ichida (schema da alohida maydon yo'q).
 * @param {unknown} movie
 * @returns {string}
 */
const directorOf = (movie) => {
  const uz = String(movie?.description?.uz?.director || '')
    .trim()
    .toLowerCase();
  if (uz) return uz;
  return String(movie?.description?.ru?.director || '')
    .trim()
    .toLowerCase();
};

/**
 * @param {string[]} a
 * @param {string[]} b
 * @returns {boolean}
 */
const hasCommonGenre = (genresA, genresB) => {
  if (!genresA.length || !genresB.length) return false;
  const setB = new Set(genresB);
  return genresA.some((g) => setB.has(g));
};

/**
 * @param {string[]} a
 * @param {string[]} b
 * @returns {number}
 */
const countCommon = (a, b) => {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  let n = 0;
  for (const item of a) {
    if (setB.has(item)) n += 1;
  }
  return n;
};

/**
 * @param {number|null} yearA
 * @param {number|null} yearB
 * @returns {number}
 */
const getYearProximityScore = (yearA, yearB) => {
  if (yearA == null || yearB == null) return 0;
  const diff = Math.abs(yearA - yearB);
  if (diff === 0) return 1;
  if (diff <= 3) return 0.7;
  if (diff <= 10) return 0.4;
  return 0.1;
};

/**
 * QATLAM 3 formula.
 * @param {object} movieA
 * @param {object} movieB
 * @returns {number}
 */
const computeGeneralSimilarity = (movieA, movieB) => {
  const w = similarityWeights.general;
  const genresA = genresOf(movieA);
  const genresB = genresOf(movieB);
  const actorsA = actorsOf(movieA);
  const actorsB = actorsOf(movieB);
  const countriesA = countriesOf(movieA);
  const countriesB = countriesOf(movieB);
  const dirA = directorOf(movieA);
  const dirB = directorOf(movieB);

  const genreOverlap = genresA.length
    ? countCommon(genresA, genresB) / genresA.length
    : 0;
  const actorOverlap = actorsA.length
    ? countCommon(actorsA, actorsB) / Math.max(actorsA.length, 1)
    : 0;
  const directorMatch = dirA && dirB && dirA === dirB ? 1 : 0;
  const countryMatch = countCommon(countriesA, countriesB) > 0 ? 1 : 0;
  const yearProximity = getYearProximityScore(yearOf(movieA), yearOf(movieB));

  return (
    w.w1Genre * genreOverlap +
    w.w2Actor * actorOverlap +
    w.w3Director * directorMatch +
    w.w4Country * countryMatch +
    w.w5Year * yearProximity
  );
};

/**
 * @param {object} movie
 * @param {string} layer
 * @param {number} score
 * @returns {{ movieId: number, movie: object, layer: string, score: number }}
 */
const toResultRow = (movie, layer, score) => ({
  movieId: movieIdOf(movie),
  movie,
  layer,
  score: Number(score) || 0,
});

/**
 * @param {Map<number, object>} byId
 * @param {number[]} ids
 * @param {Set<number>} usedIds
 * @returns {object[]}
 */
const resolveFranchiseLayer = (byId, ids, usedIds) => {
  const ordered = Array.isArray(ids) ? ids : [];
  /** @type {object[]} */
  const rows = [];

  for (const rawId of ordered) {
    const id = toMovieId(rawId);
    if (id == null || usedIds.has(id)) continue;
    const movie = byId.get(id);
    if (!movie) continue;
    usedIds.add(id);
    rows.push(toResultRow(movie, LAYERS.franchise, 0));
  }

  return rows;
};

/**
 * QATLAM 2: nom overlap + janr GATE. Yil ASC (franshiza tartibidan alohida).
 * @param {object} currentMovie
 * @param {object[]} pool
 * @param {Set<number>} usedIds
 * @returns {object[]}
 */
const resolveNameGenreLayer = (currentMovie, pool, usedIds) => {
  const minOverlap = Number(similarityWeights.minNameOverlap) || 0.3;
  const currentGenres = genresOf(currentMovie);
  /** @type {Array<{ movie: object, year: number }>} */
  const matched = [];

  for (const candidate of pool) {
    const id = movieIdOf(candidate);
    if (id == null || usedIds.has(id)) continue;

    const overlap = localizedTitleOverlapScore(currentMovie.title, candidate.title);
    if (overlap < minOverlap) continue;

    // GATE: kamida 1 umumiy janr — aks holda butunlay rad
    if (!hasCommonGenre(currentGenres, genresOf(candidate))) continue;

    matched.push({
      movie: candidate,
      year: yearOf(candidate) ?? Number.MAX_SAFE_INTEGER,
    });
  }

  matched.sort((a, b) => a.year - b.year || movieIdOf(a.movie) - movieIdOf(b.movie));

  /** @type {object[]} */
  const rows = [];
  for (const item of matched) {
    const id = movieIdOf(item.movie);
    usedIds.add(id);
    rows.push(toResultRow(item.movie, LAYERS.nameGenre, 0));
  }
  return rows;
};

/**
 * QATLAM 3: qolgan slotlar — formula, score DESC.
 * @param {object} currentMovie
 * @param {object[]} pool
 * @param {Set<number>} usedIds
 * @param {number} remainingSlots
 * @returns {object[]}
 */
const resolveGeneralLayer = (currentMovie, pool, usedIds, remainingSlots) => {
  if (remainingSlots <= 0) return [];

  /** @type {Array<{ movie: object, score: number }>} */
  const scored = [];
  for (const candidate of pool) {
    const id = movieIdOf(candidate);
    if (id == null || usedIds.has(id)) continue;
    const score = computeGeneralSimilarity(currentMovie, candidate);
    if (!(score > 0)) continue;
    scored.push({ movie: candidate, score });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score || movieIdOf(a.movie) - movieIdOf(b.movie)
  );

  /** @type {object[]} */
  const rows = [];
  for (const item of scored.slice(0, remainingSlots)) {
    const id = movieIdOf(item.movie);
    usedIds.add(id);
    rows.push(toResultRow(item.movie, LAYERS.general, item.score));
  }
  return rows;
};

/**
 * Asosiy yig'ish.
 *
 * @param {object} currentMovie
 * @param {object[]} allMovies
 * @param {{ limit?: number }} [options]
 * @returns {Array<{ movieId: number, movie: object, layer: string, score: number, position: number }>}
 */
const buildSimilarMovies = (currentMovie, allMovies, options = {}) => {
  const currentId = movieIdOf(currentMovie);
  if (currentId == null) return [];

  const limit = Math.max(1, Number(options.limit) || Number(similarityWeights.limit) || 20);
  const field = similarityWeights.franchiseField;

  /** @type {Map<number, object>} */
  const byId = new Map();
  for (const movie of allMovies || []) {
    const id = movieIdOf(movie);
    if (id == null) continue;
    if (!byId.has(id)) byId.set(id, movie);
  }

  const usedIds = new Set([currentId]);
  /** @type {object[]} */
  const result = [];

  // ——— QATLAM 1: franshiza (array tartibi; limit bilan KESILMAYDI) ———
  const franchiseIds = Array.isArray(currentMovie?.[field])
    ? currentMovie[field]
    : [];
  const layer1 = resolveFranchiseLayer(byId, franchiseIds, usedIds);
  result.push(...layer1);

  const pool = [...byId.values()].filter((m) => movieIdOf(m) !== currentId);

  // ——— QATLAM 2: nom + janr GATE ———
  const layer2 = resolveNameGenreLayer(currentMovie, pool, usedIds);
  result.push(...layer2);

  // ——— QATLAM 3: umumiy formula (faqat qolgan joy) ———
  const remainingSlots = Math.max(0, limit - result.length);
  const layer3 = resolveGeneralLayer(currentMovie, pool, usedIds, remainingSlots);
  result.push(...layer3);

  return result.map((row, index) => ({
    ...row,
    position: index + 1,
  }));
};

module.exports = {
  buildSimilarMovies,
  computeGeneralSimilarity,
  getYearProximityScore,
  hasCommonGenre,
  genresOf,
  actorsOf,
  countriesOf,
  yearOf,
  directorOf,
};
