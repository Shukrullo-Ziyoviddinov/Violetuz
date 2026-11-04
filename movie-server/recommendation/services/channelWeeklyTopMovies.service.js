/**
 * Kanal sahifasidagi haftaning top filmlari.
 * Ko‘rish va tartib umumiy weekly moduldan. Bu fayl faqat shu kanal kinolarini qoldiradi.
 * Ko‘rish kanal ichidagi alohida hisob emas — kino qayerda ochilgan bo‘lsa, o‘sha yozuv.
 *
 * @module recommendation/services/channelWeeklyTopMovies.service
 */

'use strict';

const Movie = require('../../models/Movie.model');
const { weeklyTopMoviesConfig } = require('../config/weeklyTopMovies.config');
const { readWeeklyMovieWatchStats } = require('./weeklyTopMoviesRead.service');
const { rankWeeklyTopMovies } = require('../utils/weeklyTopMoviesRanker');

/**
 * @param {Array<{ movieId?: unknown }>} stats
 * @param {string} channelId
 */
const keepChannelMovieStats = async (stats, channelId) => {
  const rows = Array.isArray(stats) ? stats : [];
  const channel = String(channelId || '').trim();
  if (!channel || rows.length === 0) return [];

  const idNums = [];
  const seen = new Set();
  for (const row of rows) {
    const n = Number(row?.movieId);
    if (!Number.isFinite(n) || seen.has(n)) continue;
    seen.add(n);
    idNums.push(n);
  }
  if (idNums.length === 0) return [];

  const docs = await Movie.find({ id: { $in: idNums }, channelId: channel })
    .select({ id: 1, _id: 0 })
    .lean();
  const live = new Set((docs || []).map((doc) => String(doc.id)));

  return rows.filter((row) => live.has(String(row?.movieId ?? '')));
};

/**
 * @param {{ now?: Date, channelId?: string }} [opts]
 */
const getChannelWeeklyTopMovies = async (opts = {}) => {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const channelId = String(opts.channelId || '').trim();
  const stats = await readWeeklyMovieWatchStats({ now });
  const channelStats = await keepChannelMovieStats(stats, channelId);
  const movies = rankWeeklyTopMovies(channelStats);

  return {
    movies,
    channelId,
    windowDays: weeklyTopMoviesConfig.weeklyWindowDays,
    limit: weeklyTopMoviesConfig.topLimit,
    minViews: weeklyTopMoviesConfig.minViews,
    source: movies.length ? 'channel_weekly_top_movies' : 'empty',
  };
};

module.exports = {
  getChannelWeeklyTopMovies,
};
