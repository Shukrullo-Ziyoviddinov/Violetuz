/**
 * Haftaning top filmlari — faqat WatchEvent o‘qish.
 * Progress, affinity, ContentView ga yozilmaydi.
 *
 * Eventdagi watchedSeconds = o‘sha paytdagi progress maksimumi (sessiya deltasi emas).
 * Shu sabab bir user×film uchun oynadagi $max olinadi, keyin userlar bo‘yicha yig‘iladi.
 * viewCount = distinct userId (qayta ko‘rish +1 emas).
 *
 * @module recommendation/services/weeklyTopMoviesRead.service
 */

'use strict';

const { WatchEvent } = require('../models');
const { weeklyTopMoviesConfig } = require('../config/weeklyTopMovies.config');
const { rankWeeklyTopMovies } = require('../utils/weeklyTopMoviesRanker');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * @param {Date} since
 * @param {Date} now
 * @returns {object[]}
 */
const buildWeeklyMovieWatchPipeline = (since, now) => [
  {
    $match: {
      watchedAt: { $gte: since, $lte: now },
      movieId: { $type: 'string', $ne: '' },
      userId: { $exists: true, $ne: null },
    },
  },
  {
    $group: {
      _id: { movieId: '$movieId', userId: '$userId' },
      watchedSeconds: { $max: '$watchedSeconds' },
    },
  },
  {
    $group: {
      _id: '$_id.movieId',
      viewCount: { $sum: 1 },
      watchedSeconds: { $sum: '$watchedSeconds' },
    },
  },
  {
    $project: {
      _id: 0,
      movieId: '$_id',
      viewCount: 1,
      watchedSeconds: 1,
    },
  },
];

/**
 * @param {{ now?: Date, windowDays?: number }} [opts]
 * @returns {Promise<Array<{ movieId: string, viewCount: number, watchedSeconds: number }>>}
 */
const readWeeklyMovieWatchStats = async (opts = {}) => {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const windowDaysRaw = Number(opts.windowDays);
  const windowDays =
    Number.isFinite(windowDaysRaw) && windowDaysRaw > 0
      ? windowDaysRaw
      : weeklyTopMoviesConfig.weeklyWindowDays;
  const since = new Date(now.getTime() - windowDays * MS_PER_DAY);

  const rows = await WatchEvent.aggregate(buildWeeklyMovieWatchPipeline(since, now));
  return Array.isArray(rows) ? rows : [];
};

/**
 * Read + rank. Writes nothing.
 *
 * @param {{ now?: Date, windowDays?: number, limit?: number, minViews?: number }} [opts]
 */
const getWeeklyTopMoviesFromWatchEvents = async (opts = {}) => {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const windowDaysRaw = Number(opts.windowDays);
  const windowDays =
    Number.isFinite(windowDaysRaw) && windowDaysRaw > 0
      ? windowDaysRaw
      : weeklyTopMoviesConfig.weeklyWindowDays;

  const stats = await readWeeklyMovieWatchStats({ now, windowDays });
  const movies = rankWeeklyTopMovies(stats, {
    limit: opts.limit,
    minViews: opts.minViews,
  });

  return {
    movies,
    windowDays,
    limit: weeklyTopMoviesConfig.topLimit,
    minViews: weeklyTopMoviesConfig.minViews,
    source: movies.length ? 'weekly_top_movies' : 'empty',
  };
};

module.exports = {
  buildWeeklyMovieWatchPipeline,
  readWeeklyMovieWatchStats,
  getWeeklyTopMoviesFromWatchEvents,
};
