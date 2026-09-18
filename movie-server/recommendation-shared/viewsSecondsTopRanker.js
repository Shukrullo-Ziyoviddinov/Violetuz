/**
 * Umumiy Top-N tartib: viewCount → seconds → to‘liq teng guruh sig‘masa kutadi.
 * Sof funksiya. DB / progress / affinity yo‘q.
 * Domen (kino / musiqa) itemId + seconds ni o‘zi map qiladi.
 *
 * @module recommendation-shared/viewsSecondsTopRanker
 */

'use strict';

const DEFAULT_MIN_VIEWS = 1;
const DEFAULT_LIMIT = 10;
const DEFAULT_MAX_LIMIT = 10;

/**
 * @param {unknown} row
 * @returns {{ itemId: string, viewCount: number, seconds: number } | null}
 */
const normalizeRow = (row) => {
  if (!row || typeof row !== 'object') return null;
  const itemId = String(row.itemId ?? row.id ?? '').trim();
  if (!itemId) return null;

  const viewCount = Number(row.viewCount);
  const seconds = Number(row.seconds);
  if (!Number.isFinite(viewCount) || viewCount < 0) return null;
  if (!Number.isFinite(seconds) || seconds < 0) return null;

  return { itemId, viewCount, seconds };
};

/**
 * @param {Array<{ itemId: string, viewCount: number, seconds: number }>} rows
 */
const dedupeByItemId = (rows) => {
  const byId = new Map();
  for (const row of rows) {
    const prev = byId.get(row.itemId);
    if (!prev) {
      byId.set(row.itemId, row);
      continue;
    }
    if (row.viewCount > prev.viewCount) {
      byId.set(row.itemId, row);
      continue;
    }
    if (row.viewCount === prev.viewCount && row.seconds > prev.seconds) {
      byId.set(row.itemId, row);
    }
  }
  return [...byId.values()];
};

const sameTieGroup = (a, b) =>
  a.viewCount === b.viewCount && a.seconds === b.seconds;

/**
 * @param {unknown[]} rawRows
 * @param {{ limit?: number, minViews?: number, maxLimit?: number }} [opts]
 * @returns {Array<{ itemId: string, viewCount: number, seconds: number, rank: number }>}
 */
const rankByViewsThenSeconds = (rawRows, opts = {}) => {
  const minViewsRaw = Number(opts.minViews);
  const minViews =
    Number.isFinite(minViewsRaw) && minViewsRaw > 0
      ? minViewsRaw
      : DEFAULT_MIN_VIEWS;

  let limit = Number(opts.limit);
  if (!Number.isFinite(limit) || limit <= 0) limit = DEFAULT_LIMIT;

  const maxLimitRaw = Number(opts.maxLimit);
  const maxLimit =
    Number.isFinite(maxLimitRaw) && maxLimitRaw > 0
      ? Math.floor(maxLimitRaw)
      : DEFAULT_MAX_LIMIT;
  limit = Math.min(maxLimit, Math.floor(limit));

  const normalized = (Array.isArray(rawRows) ? rawRows : [])
    .map(normalizeRow)
    .filter(Boolean)
    .filter((row) => row.viewCount >= minViews);

  const rows = dedupeByItemId(normalized);
  rows.sort((a, b) => {
    if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
    if (b.seconds !== a.seconds) return b.seconds - a.seconds;
    return String(a.itemId).localeCompare(String(b.itemId));
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
    itemId: row.itemId,
    viewCount: row.viewCount,
    seconds: row.seconds,
    rank: i + 1,
  }));
};

module.exports = {
  rankByViewsThenSeconds,
};
