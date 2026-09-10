/**
 * Shared Top-N ranking knobs (actors / artists).
 * Pure helpers — no DB; domains pass trending fetchers.
 *
 * @module recommendation-shared/topRanking
 */

'use strict';

const DEFAULT_TOP_LIMIT = 10;
const HARD_MAX_TOP_LIMIT = 50;

/**
 * Clamp Top-N limit for leaderboards.
 * @param {unknown} requested
 * @param {{ defaultLimit?: number, maxLimit?: number }} [cfg]
 * @returns {number}
 */
const resolveTopLimit = (requested, cfg = {}) => {
  const fallback = Math.max(1, Number(cfg.defaultLimit) || DEFAULT_TOP_LIMIT);
  const maxLimit = Math.max(
    fallback,
    Number(cfg.maxLimit) || HARD_MAX_TOP_LIMIT
  );
  const n = Number(requested);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(maxLimit, Math.floor(n));
};

/**
 * Attach 1-based ranks to an already score-DESC list.
 * @param {Array<{ score?: number } & Record<string, unknown>>} rows
 * @returns {Array<Record<string, unknown> & { rank: number, score: number }>}
 */
const withRanks = (rows = []) =>
  (Array.isArray(rows) ? rows : []).map((row, index) => ({
    ...row,
    rank: index + 1,
    score: Number(row?.score) || 0,
  }));

module.exports = {
  DEFAULT_TOP_LIMIT,
  HARD_MAX_TOP_LIMIT,
  resolveTopLimit,
  withRanks,
};
