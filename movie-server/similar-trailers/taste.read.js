/**
 * Bo‘limlar yig‘gan didni faqat o‘qiydi.
 * Janr, davlat, aktyor balli va ko‘rilgan kinolar.
 * Hisob ochiq bo‘lsa local did qo‘shilmaydi.
 * Mehmon local tarixi xotirada o‘qiladi, akkauntga yozilmaydi.
 *
 * @module similar-trailers/taste.read
 */

'use strict';

const Movie = require('../models/Movie.model');
const { UserAffinity, UserMovieProgress } = require('../recommendation/models');
const { scoringWeights } = require('../recommendation/config/scoringWeights');
const { applyDecay } = require('../recommendation/utils/decay');
const { buildFromEvents, sanitizeLocalHistory } = require('../recommendation/services/guestAffinityBuilder.service');
const { ScoreModel } = require('../recommendation-actors/store');
const { toEntityIdList } = require('../recommendation-shared/entityDistinctCount');
const { badRequest } = require('../utils/errors');

const GENRE = scoringWeights.dimensionTypes.genre;
const COUNTRY = scoringWeights.dimensionTypes.country;
const MIN_WATCHED_SECONDS = scoringWeights.progress?.minWatchedSeconds ?? 300;

/**
 * Hisob bo‘lsa local tarix hisobga kirmaydi.
 *
 * @param {{ userId?: * }} [input]
 * @returns {'account'|'guest'}
 */
const selectTasteSource = (input = {}) => {
  if (input.userId != null && input.userId !== '') return 'account';
  return 'guest';
};

/**
 * @param {Map<string, number>} into
 * @param {Object.<string, number>} [scores]
 */
const addScores = (into, scores) => {
  if (!scores || typeof scores !== 'object') return into;
  for (const [value, raw] of Object.entries(scores)) {
    const token = String(value || '').trim();
    const score = Number(raw);
    if (!token || !Number.isFinite(score) || score <= 0) continue;
    into.set(token, (into.get(token) || 0) + score);
  }
  return into;
};

/**
 * @param {Map<string, number>} scores
 * @returns {Array<{ value: string, score: number }>}
 */
const toRankedList = (scores) =>
  [...scores.entries()]
    .map(([value, score]) => ({ value, score }))
    .sort((a, b) => b.score - a.score || a.value.localeCompare(b.value));

/**
 * 5 daqiqadan qisqa ko‘rish hisobga kirmaydi.
 * Sekund yo‘q bo‘lsa, yozuv allaqachon sifatli deb hisoblanadi.
 *
 * @param {Array<Object>} events
 * @returns {number[]}
 */
const watchedIdsFromEvents = (events) => {
  /** @type {Set<number>} */
  const ids = new Set();
  for (const event of events || []) {
    const movieId = Number(event?.m ?? event?.movieId ?? event?.id);
    if (!Number.isInteger(movieId) || movieId <= 0) continue;
    const seconds = event?.watchedSeconds ?? event?.s;
    if (seconds != null && seconds !== '' && !(Number(seconds) >= MIN_WATCHED_SECONDS)) continue;
    ids.add(movieId);
  }
  return [...ids].sort((a, b) => a - b);
};

const emptyTaste = (source) => ({
  ok: true,
  source,
  genres: [],
  countries: [],
  actors: [],
  watchedMovieIds: [],
});

/**
 * @param {Array<number>} movieIds
 */
const loadMoviesById = async (movieIds) => {
  const ids = [...new Set(
    (movieIds || [])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
  )];
  /** @type {Map<number, Object>} */
  const byId = new Map();
  if (!ids.length) return byId;

  const docs = await Movie.find({ id: { $in: ids } })
    .select({
      _id: 0,
      id: 1,
      categoryName: 1,
      filterGenre: 1,
      filterCountry: 1,
      actors: 1,
    })
    .lean();

  for (const doc of docs || []) {
    byId.set(doc.id, doc);
  }
  return byId;
};

/**
 * Mehmon tarixidagi turli kinolar bo‘yicha aktyor +1.
 * Katalogdagi actors maydoni. Hisobga yozilmaydi.
 *
 * @param {Array<{ m: number }>} events
 * @param {Map<number, Object>} moviesById
 * @returns {Array<{ actorId: string, score: number }>}
 */
const countGuestActors = (events, moviesById) => {
  /** @type {Map<string, number>} */
  const scores = new Map();
  const seenMovies = new Set();

  for (const event of events || []) {
    const movieKey = String(event?.m ?? '');
    if (!movieKey || seenMovies.has(movieKey)) continue;
    seenMovies.add(movieKey);

    const movie = moviesById.get(event.m) || moviesById.get(Number(movieKey)) || null;
    if (!movie) continue;

    for (const actorId of toEntityIdList(movie.actors)) {
      scores.set(actorId, (scores.get(actorId) || 0) + 1);
    }
  }

  return [...scores.entries()]
    .map(([actorId, score]) => ({ actorId, score }))
    .sort((a, b) => b.score - a.score || a.actorId.localeCompare(b.actorId));
};

/**
 * Hisobdagi janr va davlat. Bo‘limlar bo‘yicha yig‘ilgan ballar qo‘shiladi.
 * Natija xotirada. Affinity yozilmaydi.
 *
 * @param {*} userId
 */
const readAccountGenreCountry = async (userId) => {
  const rows = await UserAffinity.find({
    userId,
    dimensionType: { $in: [GENRE, COUNTRY] },
  })
    .select({
      dimensionType: 1,
      dimensionValue: 1,
      affinityScore: 1,
      updatedAt: 1,
      _id: 0,
    })
    .lean();

  const genres = new Map();
  const countries = new Map();
  const nowMs = Date.now();

  for (const row of rows || []) {
    const value = String(row.dimensionValue || '').trim();
    if (!value) continue;
    const score = applyDecay(row.affinityScore, row.updatedAt, scoringWeights.decay, nowMs);
    if (score <= 0) continue;
    const target = row.dimensionType === COUNTRY ? countries : genres;
    target.set(value, (target.get(value) || 0) + score);
  }

  return {
    genres: toRankedList(genres),
    countries: toRankedList(countries),
  };
};

/**
 * Aktyorning turli kino soni. Ball 1 ham qaytadi.
 *
 * @param {*} userId
 */
const readAccountActors = async (userId) => {
  const rows = await ScoreModel.find({ userId, score: { $gte: 1 } })
    .select({ actorId: 1, score: 1, _id: 0 })
    .lean();

  return (rows || [])
    .map((row) => ({
      actorId: String(row.actorId),
      score: Number(row.score) || 0,
    }))
    .filter((row) => row.actorId && row.score > 0)
    .sort((a, b) => b.score - a.score || a.actorId.localeCompare(b.actorId));
};

/**
 * @param {*} userId
 * @returns {Promise<number[]>}
 */
const readAccountWatchedIds = async (userId) => {
  const rows = await UserMovieProgress.find({
    userId,
    watchedSeconds: { $gte: MIN_WATCHED_SECONDS },
  })
    .select({ movieId: 1, _id: 0 })
    .lean();

  return watchedIdsFromEvents(rows);
};

/**
 * @param {*} userId
 */
const readAccountTaste = async (userId) => {
  if (userId == null || userId === '') throw badRequest('userId majburiy');

  const [genreCountry, actors, watchedMovieIds] = await Promise.all([
    readAccountGenreCountry(userId),
    readAccountActors(userId),
    readAccountWatchedIds(userId),
  ]);

  return {
    ok: true,
    source: 'account',
    genres: genreCountry.genres,
    countries: genreCountry.countries,
    actors,
    watchedMovieIds,
  };
};

/**
 * @param {unknown} localHistory
 */
const readGuestTaste = async (localHistory) => {
  const sanitized = sanitizeLocalHistory(localHistory);
  if (!sanitized.ok) return sanitized;
  if (!sanitized.events.length) return emptyTaste('guest');

  const moviesById = await loadMoviesById(sanitized.events.map((event) => event.m));
  const categories = new Set();
  for (const movie of moviesById.values()) {
    const category = String(movie.categoryName || '').trim();
    if (category) categories.add(category);
  }

  const genres = new Map();
  const countries = new Map();
  for (const category of categories) {
    const built = buildFromEvents(localHistory, { category, moviesById });
    if (!built.ok) return built;
    addScores(genres, built.affinityMap?.[GENRE]);
    addScores(countries, built.affinityMap?.[COUNTRY]);
  }

  return {
    ok: true,
    source: 'guest',
    genres: toRankedList(genres),
    countries: toRankedList(countries),
    actors: countGuestActors(sanitized.events, moviesById),
    watchedMovieIds: watchedIdsFromEvents(sanitized.events),
  };
};

/**
 * Hisob bo‘lsa faqat hisob o‘qiladi. localHistory e’tiborsiz.
 *
 * @param {{ userId?: *, localHistory?: unknown }} [input]
 */
const readTaste = async (input = {}) => {
  if (selectTasteSource(input) === 'account') {
    return readAccountTaste(input.userId);
  }
  return readGuestTaste(input.localHistory);
};

module.exports = {
  readTaste,
  readAccountTaste,
  readGuestTaste,
  watchedIdsFromEvents,
};
