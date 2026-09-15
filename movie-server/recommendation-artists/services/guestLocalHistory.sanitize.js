/**
 * Sanitize guest music localHistory for recommended-artists.
 * Shape kept: { m, ct, r, t } — category `c` not required (artists are catalog-derived).
 * DB write YO‘Q — validation only (score builder wires next).
 *
 * @module recommendation-artists/services/guestLocalHistory.sanitize
 */

'use strict';

const {
  guestHistoryConfig,
  MS_PER_DAY,
} = require('../config/guestHistory.config');
const {
  normalizeContentType,
  isValidContentType,
} = require('../../recommendation-music/utils/contentKey');

/**
 * @param {unknown} raw
 * @param {object} [opts]
 * @param {number} [opts.nowMs]
 * @param {typeof guestHistoryConfig} [opts.config]
 * @returns {{ ok: true, events: Array<{m:string,ct:string,r:number,t:number}> } | { ok: false, error: string }}
 */
const sanitizeLocalHistory = (raw, opts = {}) => {
  const cfg = opts.config || guestHistoryConfig;
  const nowMs = opts.nowMs ?? Date.now();

  if (raw == null) {
    return { ok: true, events: [] };
  }
  if (!Array.isArray(raw)) {
    return { ok: false, error: 'localHistory must be an array' };
  }
  if (raw.length > cfg.MAX_ENTRIES) {
    return {
      ok: false,
      error: `localHistory length exceeds MAX_ENTRIES (${cfg.MAX_ENTRIES})`,
    };
  }

  const cutoff = nowMs - cfg.MAX_AGE_DAYS * MS_PER_DAY;
  /** @type {Array<{m:string,ct:string,r:number,t:number}>} */
  const events = [];

  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;

    const m = row.m ?? row.contentId ?? row.id;
    if (m == null || m === '') continue;

    const idStr = String(m).trim();
    if (!idStr) {
      return { ok: false, error: `invalid contentId: ${String(m)}` };
    }

    const ct = normalizeContentType(row.ct ?? row.contentType);
    if (!isValidContentType(ct)) {
      return {
        ok: false,
        error: `invalid contentType: ${String(row.ct ?? row.contentType)}`,
      };
    }

    const r = Number(row.r ?? row.completionRate);
    const t = Number(row.t ?? row.timestampMs);
    if (!Number.isFinite(r) || !Number.isFinite(t)) continue;
    if (r < cfg.MIN_COMPLETION_RATE) continue;
    if (t < cutoff) continue;

    events.push({
      m: idStr,
      ct,
      r: Math.min(1, Math.max(0, r)),
      t,
    });
  }

  // Oldest → newest (stable chronology for later distinct-credit fold)
  events.sort((a, b) => a.t - b.t);
  return { ok: true, events };
};

module.exports = {
  sanitizeLocalHistory,
  guestHistoryConfig,
};
