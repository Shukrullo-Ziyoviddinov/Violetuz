/**
 * Bo‘limlar yig‘gan didni faqat o‘qiydi.
 * Drama, serial va qolgan bo‘limlarning tartibiga yozilmaydi.
 * Hisob o‘z yig‘indisini o‘qiydi. Mehmon local tarixni o‘qiydi.
 * Hisob ochiq bo‘lsa local did qo‘shilmaydi.
 *
 * @module recommendation-triller/services/taste.read
 */

'use strict';

const Movie = require('../../models/Movie.model');
const { UserAffinity, UserMovieProgress } = require('../../recommendation/models');
const { scoringWeights } = require('../../recommendation/config/scoringWeights');
const { applyDecay } = require('../../recommendation/utils/decay');
const { buildFromEvents, sanitizeLocalHistory } = require('../../recommendation/services/guestAffinityBuilder.service');
const { ScoreModel } = require('../../recommendation-actors/store');
const { toEntityIdList } = require('../../recommendation-shared/entityDistinctCount');
const { badRequest } = require('../../utils/errors');
const {
  selectTasteSource,
  addScores,
  toRankedList,
  countGuestActors,
} = require('./tasteShape');
const { readCrowdTaste } = require('./crowdTaste.read');
const { countQualityMovies, crowdFade, blendScoreRows } = require('./crowdFade');

const GENRE = scoringWeights.dimensionTypes.genre;
const COUNTRY = scoringWeights.dimensionTypes.country;
const MIN_WATCHED_SECONDS = scoringWeights.progress?.minWatchedSeconds ?? 300;

const emptyTaste = (source) => ({
  ok: true,
  source,
  genres: [],
  countries: [],
  actors: [],
  watchedMovieCount: 0,
});

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
 * Tavsiya ro‘yxatining 2 lik chegarasi bu yerda qo‘llanmaydi.
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

const countAccountMovies = async (userId) => {
  const ids = await UserMovieProgress.distinct('movieId', {
    userId,
    watchedSeconds: { $gte: MIN_WATCHED_SECONDS },
  });
  return Array.isArray(ids) ? ids.length : 0;
};

/**
 * @param {*} userId
 */
const readAccountTaste = async (userId) => {
  if (userId == null || userId === '') throw badRequest('userId majburiy');

  const [genreCountry, actors, watchedMovieCount] = await Promise.all([
    readAccountGenreCountry(userId),
    readAccountActors(userId),
    countAccountMovies(userId),
  ]);

  return {
    ok: true,
    source: 'account',
    genres: genreCountry.genres,
    countries: genreCountry.countries,
    actors,
    watchedMovieCount,
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
    actors: countGuestActors(sanitized.events, moviesById, toEntityIdList),
    watchedMovieCount: countQualityMovies(sanitized.events),
  };
};

/**
 * Olomon ulushi. 6 ta sifatli kinodan keyin olomon o‘qilmaydi.
 *
 * @param {Object} personal
 */
const applyCrowdFade = async (personal) => {
  const fade = crowdFade(personal.watchedMovieCount);
  if (!fade.callCrowd) {
    return { ...personal, fade };
  }

  const crowd = await readCrowdTaste();

  if (fade.mode === 'all') {
    return {
      ...crowd,
      fade,
      watchedMovieCount: personal.watchedMovieCount,
    };
  }

  if (fade.mode === 'rest') {
    return {
      ...crowd,
      source: 'rest',
      fade,
      watchedMovieCount: personal.watchedMovieCount,
      personal,
    };
  }

  if (fade.mode === 'half') {
    return {
      ok: true,
      source: 'blend',
      fade,
      watchedMovieCount: personal.watchedMovieCount,
      genres: blendScoreRows(personal.genres, crowd.genres, fade.crowdShare, 'value'),
      countries: blendScoreRows(personal.countries, crowd.countries, fade.crowdShare, 'value'),
      actors: blendScoreRows(personal.actors, crowd.actors, fade.crowdShare, 'actorId'),
    };
  }

  return {
    ...personal,
    fade,
    crowdFill: {
      genres: crowd.genres,
      countries: crowd.countries,
      actors: crowd.actors,
    },
  };
};

/**
 * Hisob bo‘lsa faqat hisob o‘qiladi. localHistory e’tiborsiz.
 *
 * @param {{ userId?: *, localHistory?: unknown }} [input]
 */
const readTaste = async (input = {}) => {
  if (selectTasteSource(input) === 'account') {
    const account = await readAccountTaste(input.userId);
    return applyCrowdFade(account);
  }

  const guest = await readGuestTaste(input.localHistory);
  if (!guest.ok) return guest;
  return applyCrowdFade(guest);
};

module.exports = {
  readTaste,
  readAccountTaste,
  readGuestTaste,
  readCrowdTaste,
};
