/**
 * Oyning top filmlari — faqat WatchEvent o‘qish.
 * Pipeline va tartib weekly moduldan. Bu fayl faqat 30 kunlik oyna va o‘z limitini beradi.
 * Progress, affinity, ContentView ga yozilmaydi.
 *
 * @module recommendation/services/monthlyTopMoviesRead.service
 */

'use strict';

const { monthlyTopMoviesConfig } = require('../config/monthlyTopMovies.config');
const { readWeeklyMovieWatchStats } = require('./weeklyTopMoviesRead.service');
const { rankWeeklyTopMovies } = require('../utils/weeklyTopMoviesRanker');

/**
 * @param {unknown} value
 * @returns {number | undefined}
 */
const positiveNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/**
 * Read + same ranker. Writes nothing. Oyna configdan, query oyna o‘zgartirmaydi.
 *
 * @param {{ now?: Date, limit?: number }} [opts]
 */
const getMonthlyTopMoviesFromWatchEvents = async (opts = {}) => {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const windowDays = monthlyTopMoviesConfig.windowDays;
  const stats = await readWeeklyMovieWatchStats({ now, windowDays });
  const movies = rankWeeklyTopMovies(stats, {
    limit: positiveNumber(opts.limit) ?? monthlyTopMoviesConfig.topLimit,
    minViews: monthlyTopMoviesConfig.minViews,
    maxLimit: monthlyTopMoviesConfig.topMaxLimit,
  });

  return {
    movies,
    windowDays,
    limit: monthlyTopMoviesConfig.topLimit,
    minViews: monthlyTopMoviesConfig.minViews,
    source: movies.length ? 'monthly_top_movies' : 'empty',
  };
};

module.exports = {
  getMonthlyTopMoviesFromWatchEvents,
};
