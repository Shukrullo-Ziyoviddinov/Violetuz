/**
 * Similar cache precompute.
 * Sahifa ochilganda hisoblanmaydi — faqat job yozadi.
 * recommendation / home-feed navbatiga yozilmaydi.
 *
 * @module movie-similar/jobs/movieSimilarityPrecompute.job
 */

'use strict';

const { similarityWeights } = require('../config/similarityWeights');
const { buildSimilarMovies } = require('../services/similarMoviesEngine');
const {
  listAllCatalogMovies,
  findCatalogMovieById,
  toMovieId,
} = require('../repositories/catalog.read');
const { replaceSimilarForMovie } = require('../repositories/similarCache.repository');

/** @type {ReturnType<typeof setInterval>|null} */
let timer = null;
/** @type {ReturnType<typeof setTimeout>|null} */
let bootTimer = null;
let running = false;

const franchiseField = () => similarityWeights.franchiseField;

/**
 * Yangilangan kinolar + ularning franshiza bog'lovchilari
 * (ikki tomonlama: men bog'laganlar va meni bog'laganlar).
 *
 * @param {Array<string|number>} seedIds
 * @param {object[]} allMovies
 * @returns {number[]}
 */
const collectAffectedMovieIds = (seedIds, allMovies) => {
  const field = franchiseField();
  /** @type {Set<number>} */
  const affected = new Set();
  for (const raw of seedIds || []) {
    const id = toMovieId(raw);
    if (id != null) affected.add(id);
  }
  if (!affected.size) return [];

  for (const movie of allMovies || []) {
    const id = toMovieId(movie?.id);
    if (id == null) continue;
    const links = Array.isArray(movie?.[field]) ? movie[field] : [];

    if (affected.has(id)) {
      for (const linked of links) {
        const lid = toMovieId(linked);
        if (lid != null) affected.add(lid);
      }
      continue;
    }

    for (const linked of links) {
      const lid = toMovieId(linked);
      if (lid != null && affected.has(lid)) {
        affected.add(id);
        break;
      }
    }
  }

  return [...affected];
};

/**
 * Bitta kino: engine → cache.
 * @param {object} currentMovie
 * @param {object[]} allMovies
 * @returns {Promise<number>} written rows
 */
const recomputeOne = async (currentMovie, allMovies) => {
  const id = toMovieId(currentMovie?.id);
  if (id == null) return 0;
  const built = buildSimilarMovies(currentMovie, allMovies, {
    limit: similarityWeights.limit,
  });
  const rows = built.map((row) => ({
    similarMovieId: row.movieId,
    position: row.position,
    layer: row.layer,
    score: row.score,
  }));
  const saved = await replaceSimilarForMovie(id, rows);
  return saved.written;
};

/**
 * Berilgan id lar (+ franshiza ta'siri) uchun qayta hisob.
 *
 * @param {Array<string|number>} movieIds
 * @returns {Promise<{ movies: number, written: number, affectedIds: number[] }>}
 */
const refreshSimilarForMovieIds = async (movieIds) => {
  const allMovies = await listAllCatalogMovies();
  const affectedIds = collectAffectedMovieIds(movieIds, allMovies);
  if (!affectedIds.length) {
    return { movies: 0, written: 0, affectedIds: [] };
  }

  const byId = new Map(
    allMovies.map((movie) => [toMovieId(movie.id), movie]).filter(([id]) => id != null)
  );

  let written = 0;
  for (const id of affectedIds) {
    let movie = byId.get(id);
    if (!movie) {
      movie = await findCatalogMovieById(id);
    }
    if (!movie) {
      await replaceSimilarForMovie(id, []);
      continue;
    }
    written += await recomputeOne(movie, allMovies);
  }

  return { movies: affectedIds.length, written, affectedIds };
};

/**
 * Butun katalog.
 * @returns {Promise<{ movies: number, written: number }>}
 */
const refreshAllSimilarMovies = async () => {
  const allMovies = await listAllCatalogMovies();
  let written = 0;

  for (const movie of allMovies) {
    written += await recomputeOne(movie, allMovies);
  }

  return { movies: allMovies.length, written };
};

const startMovieSimilarityPrecomputeScheduler = (options = {}) => {
  const intervalMs =
    Number(options.intervalMs) || similarityWeights.precomputeIntervalMs;
  const initialDelayMs = Math.max(0, Number(options.initialDelayMs) ?? 40_000);
  if (timer || bootTimer) {
    return { started: false, reason: 'already_running', intervalMs };
  }

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await refreshAllSimilarMovies();
      // eslint-disable-next-line no-console
      console.log(
        `[movie-similar:precompute] movies=${result.movies} rows=${result.written}`
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[movie-similar:precompute] failed:', err?.message || err);
    } finally {
      running = false;
    }
  };

  if (options.runImmediately !== false) {
    bootTimer = setTimeout(() => {
      bootTimer = null;
      tick();
    }, initialDelayMs);
    if (typeof bootTimer.unref === 'function') bootTimer.unref();
  }

  timer = setInterval(tick, intervalMs);
  if (typeof timer.unref === 'function') timer.unref();
  return { started: true, intervalMs, initialDelayMs };
};

const stopMovieSimilarityPrecomputeScheduler = () => {
  if (bootTimer) {
    clearTimeout(bootTimer);
    bootTimer = null;
  }
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  collectAffectedMovieIds,
  refreshSimilarForMovieIds,
  refreshAllSimilarMovies,
  startMovieSimilarityPrecomputeScheduler,
  stopMovieSimilarityPrecomputeScheduler,
};
