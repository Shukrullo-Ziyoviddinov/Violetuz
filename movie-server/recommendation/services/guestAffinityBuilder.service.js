/**
 * Build affinityMap from guest localHistory — DB write YO‘Q.
 * Uses the same computeWatchAffinityDelta / reinforce kernel as login jobs.
 *
 * @module recommendation/services/guestAffinityBuilder.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { dimensions, extractAllDimensionValues } = require('../dimensions');
const {
  guestHistoryConfig,
  getDecayWeight,
  MS_PER_DAY,
} = require('../config/guestHistory.config');
const {
  resolveBoost,
  collectDimensionKeys,
  cellMapKey,
  computeReinforcedCells,
} = require('../utils/affinityCalculator');

/**
 * @param {unknown} raw
 * @param {object} [opts]
 * @returns {{ ok: true, events: Array<{m:string|number,c:string,r:number,t:number}> } | { ok: false, error: string }}
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
  /** @type {Array<{m:string|number,c:string,r:number,t:number}>} */
  const events = [];

  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;

    const m = row.m ?? row.movieId ?? row.id;
    if (m == null || m === '') continue;

    // Positive integer movie id (catalog)
    const idNum = Number(m);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return { ok: false, error: `invalid movieId: ${String(m)}` };
    }

    const r = Number(row.r ?? row.completionRate);
    const t = Number(row.t ?? row.timestampMs);
    if (!Number.isFinite(r) || !Number.isFinite(t)) continue;
    if (r < cfg.MIN_COMPLETION_RATE) continue;
    if (t < cutoff) continue;

    events.push({
      m: idNum,
      c: row.c != null ? String(row.c).trim() : '',
      r: Math.min(1, Math.max(0, r)),
      t,
    });
  }

  // Oldest → newest so reinforce order matches watch chronology
  events.sort((a, b) => a.t - b.t);
  return { ok: true, events };
};

/**
 * Fold sanitized events into a plain AffinityMap (scores only).
 * Only events whose category matches `category` (or movie.categoryName) apply.
 *
 * @param {Array<{m:*,c:string,r:number,t:number}>} events
 * @param {Object} params
 * @param {string} params.category
 * @param {Map<string|number, Object>} params.moviesById — id → movie projection/doc
 * @param {number} [params.nowMs]
 * @returns {{ affinityMap: Object, experienceCount: number, watchedIds: Set<string>, appliedEvents: number }}
 */
const buildAffinityMapFromEvents = (
  events,
  { category, moviesById, nowMs = Date.now(), dims = dimensions, weights = scoringWeights } = {}
) => {
  const cat = String(category || '').trim();
  /** @type {Map<string, { affinityScore: number, updatedAt: Date }>} */
  const cellMap = new Map();
  /** @type {Set<string>} */
  const watchedIds = new Set();
  /** @type {Map<string, number>} */
  const priorByMovie = new Map();
  /** @type {Set<string>} */
  const qualityMovieIds = new Set();
  let appliedEvents = 0;

  const qualityMin =
    typeof weights?.blend?.qualityMinCompletion === 'number' &&
    !Number.isNaN(weights.blend.qualityMinCompletion)
      ? weights.blend.qualityMinCompletion
      : 0.3;

  if (!cat || !Array.isArray(events) || !events.length) {
    return {
      affinityMap: {},
      experienceCount: 0,
      watchedIds,
      appliedEvents: 0,
    };
  }

  for (const event of events) {
    const movie = moviesById.get(event.m) || moviesById.get(String(event.m));
    if (!movie) continue;

    // Trust catalog category only — never client-forged event.c
    const movieCat = String(movie.categoryName || '').trim();
    if (!movieCat || movieCat !== cat) continue;

    const valuesByType = extractAllDimensionValues(movie, dims);
    const keys = collectDimensionKeys(valuesByType, dims);
    if (!keys.length) continue;

    const movieKey = String(event.m);
    const priorWatchCount = priorByMovie.get(movieKey) || 0;
    const decayW = getDecayWeight(event.t, nowMs);
    if (decayW <= 0) continue;

    const baseBoost = resolveBoost(
      { completionRate: event.r, liked: false },
      priorWatchCount,
      weights
    );
    const boost = baseBoost * decayW;

    const scoredCells = computeReinforcedCells({
      keys,
      existing: cellMap,
      boost,
      nowMs,
      weights,
    });

    for (const cell of scoredCells) {
      cellMap.set(cellMapKey(cell.dimensionType, cell.dimensionValue), {
        affinityScore: cell.affinityScore,
        updatedAt: cell.updatedAt,
      });
    }

    priorByMovie.set(movieKey, priorWatchCount + 1);
    watchedIds.add(movieKey);
    appliedEvents += 1;

    // Login parity: DISTINCT movieId where completionRate > qualityMinCompletion
    // (not raw appliedEvents — prevents α gaming via rewatches / low-r rows)
    if (event.r > qualityMin) {
      qualityMovieIds.add(movieKey);
    }
  }

  /** @type {import('../types/recommendation.types').AffinityMap} */
  const affinityMap = {};
  for (const [mapKey, cell] of cellMap.entries()) {
    const sep = mapKey.indexOf('\0');
    if (sep < 0) continue;
    const dimensionType = mapKey.slice(0, sep);
    const dimensionValue = mapKey.slice(sep + 1);
    if (!affinityMap[dimensionType]) affinityMap[dimensionType] = {};
    affinityMap[dimensionType][dimensionValue] = cell.affinityScore;
  }

  return {
    affinityMap,
    experienceCount: qualityMovieIds.size,
    watchedIds,
    appliedEvents,
  };
};

/**
 * High-level: sanitize + build (moviesById required for dimension extract).
 */
const buildFromEvents = (localHistory, options = {}) => {
  const nowMs = options.nowMs ?? Date.now();
  const sanitized = sanitizeLocalHistory(localHistory, {
    nowMs,
    config: options.config || guestHistoryConfig,
  });
  if (!sanitized.ok) {
    return sanitized;
  }

  const built = buildAffinityMapFromEvents(sanitized.events, {
    category: options.category,
    moviesById: options.moviesById || new Map(),
    nowMs,
    dims: options.dims,
    weights: options.weights,
  });

  return {
    ok: true,
    events: sanitized.events,
    ...built,
  };
};

module.exports = {
  sanitizeLocalHistory,
  buildAffinityMapFromEvents,
  buildFromEvents,
  getDecayWeight,
  guestHistoryConfig,
};
