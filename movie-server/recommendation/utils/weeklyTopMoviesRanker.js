/**
 * Haftaning top filmlari tartibi — sof funksiya, DB / progress / affinity yo‘q.
 *
 * 1) viewCount yuqori bo‘lsa oldinda (daqiqa buni yengmaydi)
 * 2) viewCount teng bo‘lsa watchedSeconds (jami daqiqa)
 * 3) ikkalasi ham teng bo‘lgan guruh qolgan joyga to‘liq sig‘masa — hech biri kirmaydi
 *
 * @module recommendation/utils/weeklyTopMoviesRanker
 */

'use strict';

const { weeklyTopMoviesConfig } = require('../config/weeklyTopMovies.config');

/**
 * @param {unknown} row
 * @returns {{ movieId: string, viewCount: number, watchedSeconds: number } | null}
 */
const normalizeRow = (row) => {
  if (!row || typeof row !== 'object') return null;
  const movieId = String(row.movieId ?? row.id ?? '').trim();
  if (!movieId) return null;

  const viewCount = Number(row.viewCount);
  const watchedSeconds = Number(row.watchedSeconds);
  if (!Number.isFinite(viewCount) || viewCount < 0) return null;
  if (!Number.isFinite(watchedSeconds) || watchedSeconds < 0) return null;

  return {
    movieId,
    viewCount,
    watchedSeconds,
  };
};

/**
 * Same movieId twice: keep the stronger signal (views, then seconds).
 * @param {Array<{ movieId: string, viewCount: number, watchedSeconds: number }>} rows
 */
const dedupeByMovieId = (rows) => {
  const byId = new Map();
  for (const row of rows) {
    const prev = byId.get(row.movieId);
    if (!prev) {
      byId.set(row.movieId, row);
      continue;
    }
    if (row.viewCount > prev.viewCount) {
      byId.set(row.movieId, row);
      continue;
    }
    if (row.viewCount === prev.viewCount && row.watchedSeconds > prev.watchedSeconds) {
      byId.set(row.movieId, row);
    }
  }
  return [...byId.values()];
};

const sameTieGroup = (a, b) =>
  a.viewCount === b.viewCount && a.watchedSeconds === b.watchedSeconds;

/**
 * @param {unknown[]} rawRows
 * @param {{ limit?: number, minViews?: number }} [opts]
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
  limit = Math.min(cfg.topMaxLimit ?? cfg.topLimit, Math.floor(limit));

  const normalized = (Array.isArray(rawRows) ? rawRows : [])
    .map(normalizeRow)
    .filter(Boolean)
    .filter((row) => row.viewCount >= minViews);

  const rows = dedupeByMovieId(normalized);
  rows.sort((a, b) => {
    if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
    if (b.watchedSeconds !== a.watchedSeconds) return b.watchedSeconds - a.watchedSeconds;
    return String(a.movieId).localeCompare(String(b.movieId));
  });

  const selected = [];
  let index = 0;

  while (index < rows.length && selected.length < limit) {
    const head = rows[index];
    let end = index + 1;
    while (end < rows.length && sameTieGroup(rows[end], head)) end += 1;

    const groupSize = end - index;
    const remaining = limit - selected.length;
    if (groupSize > remaining) break;

    for (let i = index; i < end; i += 1) {
      selected.push(rows[i]);
    }
    index = end;
  }

  return selected.map((row, i) => ({
    movieId: row.movieId,
    viewCount: row.viewCount,
    watchedSeconds: row.watchedSeconds,
    rank: i + 1,
  }));
};

module.exports = {
  rankWeeklyTopMovies,
};
