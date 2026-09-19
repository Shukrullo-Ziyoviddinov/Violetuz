/**
 * Musiqa weekly/monthly top — umumiy ranker ustida yupqa adapter.
 * Formula bu yerda emas. Config defaultlari weekly knobsdan.
 *
 * @module recommendation-music/utils/musicListenStatsRanker
 */

'use strict';

const { weeklyTopMusicConfig } = require('../config/weeklyTopMusic.config');
const {
  rankByViewsThenSeconds,
} = require('../../recommendation-shared/viewsSecondsTopRanker');

/**
 * @param {unknown} value
 * @returns {number | undefined}
 */
const positiveNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/**
 * @param {unknown} row
 * @returns {{ itemId: string, viewCount: number, seconds: number } | null}
 */
const toSharedRow = (row) => {
  if (!row || typeof row !== 'object') return null;
  const itemId = String(row.contentKey ?? '').trim();
  if (!itemId) return null;

  const viewCount = Number(row.viewCount);
  const seconds = Number(row.listenedSeconds);
  if (!Number.isFinite(viewCount) || viewCount < 0) return null;
  if (!Number.isFinite(seconds) || seconds < 0) return null;

  return { itemId, viewCount, seconds };
};

/**
 * ListenEvent stats → ranked music items (map → shared ranker → remap).
 *
 * @param {unknown[]} rawRows
 * @param {{ limit?: number, minViews?: number, maxLimit?: number }} [opts]
 * @returns {Array<{ contentKey: string, contentId: string, viewCount: number, listenedSeconds: number, rank: number }>}
 */
const rankMusicListenStats = (rawRows, opts = {}) => {
  const cfg = weeklyTopMusicConfig;
  const stats = Array.isArray(rawRows) ? rawRows : [];
  const byKey = new Map(
    stats.map((row) => [String(row?.contentKey ?? ''), row])
  );

  const sharedRows = stats.map(toSharedRow).filter(Boolean);

  return rankByViewsThenSeconds(sharedRows, {
    limit: positiveNumber(opts.limit) ?? cfg.topLimit,
    minViews: positiveNumber(opts.minViews) ?? cfg.minViews,
    maxLimit: positiveNumber(opts.maxLimit) ?? cfg.topMaxLimit,
  }).map((row) => {
    const raw = byKey.get(row.itemId);
    return {
      contentKey: row.itemId,
      contentId: raw?.contentId != null ? String(raw.contentId) : '',
      viewCount: row.viewCount,
      listenedSeconds: row.seconds,
      rank: row.rank,
    };
  });
};

module.exports = {
  rankMusicListenStats,
};
