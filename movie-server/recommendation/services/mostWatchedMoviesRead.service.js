/**
 * Hozir trendda — faqat WatchEvent o‘qish.
 * Pipeline weekly moduldan (`readWeeklyMovieWatchStats`), tartib weekly ranker.
 * Bu fayl faqat 7 kunlik suriluvchi oyna va limit 20 beradi.
 * Progress, affinity, ContentView ga yozilmaydi. Tomosha yozuvi o‘chirilmaydi.
 * Katalogda yo‘q (o‘chirilgan) movieId lar rankga kirmaydi.
 *
 * @module recommendation/services/mostWatchedMoviesRead.service
 */

'use strict';

const Movie = require('../../models/Movie.model');
const { mostWatchedMoviesConfig } = require('../config/mostWatchedMovies.config');
const { readWeeklyMovieWatchStats } = require('./weeklyTopMoviesRead.service');
const { rankWeeklyTopMovies } = require('../utils/weeklyTopMoviesRanker');

/**
 * @param {Array<{ movieId?: unknown }>} stats
 * @returns {Promise<Array<{ movieId?: unknown }>>}
 */
const keepStatsWithLiveMovies = async (stats) => {
  const rows = Array.isArray(stats) ? stats : [];
  if (rows.length === 0) return [];

  const idNums = [];
  const seen = new Set();
  for (const row of rows) {
    const n = Number(row?.movieId);
    if (!Number.isFinite(n) || seen.has(n)) continue;
    seen.add(n);
    idNums.push(n);
  }
  if (idNums.length === 0) return [];

  const docs = await Movie.find({ id: { $in: idNums } })
    .select({ id: 1, _id: 0 })
    .lean();
  const live = new Set((docs || []).map((d) => String(d.id)));

  return rows.filter((row) => live.has(String(row?.movieId ?? '')));
};

/**
 * Read + same ranker. Writes nothing. Oyna configdan, query oyna o‘zgartirmaydi.
 *
 * @param {{ now?: Date, limit?: number }} [opts]
 */
const getMostWatchedMoviesFromWatchEvents = async (opts = {}) => {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const windowDays = mostWatchedMoviesConfig.windowDays;
  const requested = Number(opts.limit);
  const limit =
    Number.isFinite(requested) && requested > 0
      ? requested
      : mostWatchedMoviesConfig.topLimit;

  const stats = await readWeeklyMovieWatchStats({ now, windowDays });
  const liveStats = await keepStatsWithLiveMovies(stats);
  const movies = rankWeeklyTopMovies(liveStats, {
    limit,
    minViews: mostWatchedMoviesConfig.minViews,
    maxLimit: mostWatchedMoviesConfig.topMaxLimit,
  });

  return {
    movies,
    windowDays,
    limit: mostWatchedMoviesConfig.topLimit,
    minViews: mostWatchedMoviesConfig.minViews,
    source: movies.length ? 'most_watched_movies' : 'empty',
  };
};

module.exports = {
  getMostWatchedMoviesFromWatchEvents,
  keepStatsWithLiveMovies,
};
