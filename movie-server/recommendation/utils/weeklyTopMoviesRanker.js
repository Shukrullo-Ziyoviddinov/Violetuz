/**
 * Kino weekly/monthly top — umumiy ranker ustida yupqa adapter.
 * Formula bu yerda emas. Config defaultlari shu faylda.
 *
 * @module recommendation/utils/weeklyTopMoviesRanker
 */

'use strict';

const { weeklyTopMoviesConfig } = require('../config/weeklyTopMovies.config');
const {
  rankByViewsThenSeconds,
} = require('../../recommendation-shared/viewsSecondsTopRanker');

/**
 * @param {unknown} row
 * @returns {{ itemId: string, viewCount: number, seconds: number } | null}
 */
const toSharedRow = (row) => {
  if (!row || typeof row !== 'object') return null;
  const itemId = String(row.movieId ?? row.id ?? '').trim();
  if (!itemId) return null;

  const viewCount = Number(row.viewCount);
  const seconds = Number(row.watchedSeconds);
  if (!Number.isFinite(viewCount) || viewCount < 0) return null;
  if (!Number.isFinite(seconds) || seconds < 0) return null;

  return { itemId, viewCount, seconds };
};

/**
 * @param {unknown[]} rawRows
 * @param {{ limit?: number, minViews?: number, maxLimit?: number }} [opts]
 * @returns {Array<{ movieId: string, viewCount: number, watchedSeconds: number, rank: number }>}
 */
const rankWeeklyTopMovies = (rawRows, opts = {}) => {
  const cfg = weeklyTopMoviesConfig;
  const minViews =
    Number.isFinite(Number(opts.minViews)) && Number(opts.minViews) > 0
      ? Number(opts.minViews)
      : cfg.minViews;

  let limit = Number(opts.limit);
  if (!Number.isFinite(limit) || limit <= 0) limit = cfg.topLimit;

  const maxLimitRaw = Number(opts.maxLimit);
  const maxLimit =
    Number.isFinite(maxLimitRaw) && maxLimitRaw > 0
      ? Math.floor(maxLimitRaw)
      : cfg.topMaxLimit ?? cfg.topLimit;

  const sharedRows = (Array.isArray(rawRows) ? rawRows : [])
    .map(toSharedRow)
    .filter(Boolean);

  return rankByViewsThenSeconds(sharedRows, {
    limit,
    minViews,
    maxLimit,
  }).map((row) => ({
    movieId: row.itemId,
    viewCount: row.viewCount,
    watchedSeconds: row.seconds,
    rank: row.rank,
  }));
};

module.exports = {
  rankWeeklyTopMovies,
};
