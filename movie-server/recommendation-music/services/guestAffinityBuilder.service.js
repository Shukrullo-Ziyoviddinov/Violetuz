/**
 * Build affinityMap from guest music localHistory — DB write YO‘Q.
 * Rows: { m, c, ct, r, t } — uses music affinityCalculator kernel.
 *
 * @module recommendation-music/services/guestAffinityBuilder.service
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
const {
  normalizeContentType,
  isValidContentType,
  toContentKey,
} = require('../utils/contentKey');

/**
 * @param {unknown} raw
 * @param {object} [opts]
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
  /** @type {Array<{m:number|string,c:string,ct:string,r:number,t:number}>} */
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
      return { ok: false, error: `invalid contentType: ${String(row.ct ?? row.contentType)}` };
    }

    const r = Number(row.r ?? row.completionRate);
    const t = Number(row.t ?? row.timestampMs);
    if (!Number.isFinite(r) || !Number.isFinite(t)) continue;
    if (r < cfg.MIN_COMPLETION_RATE) continue;
    if (t < cutoff) continue;

    events.push({
      m: idStr,
      c: row.c != null ? String(row.c).trim() : '',
      ct,
      r: Math.min(1, Math.max(0, r)),
      t,
    });
  }

  events.sort((a, b) => a.t - b.t);
  return { ok: true, events };
};

/**
 * @param {Array} events
 * @param {Object} params
 * @param {string} params.category — categoryNameMusic
 * @param {string|null} [params.contentType] — optional scope filter
 * @param {Map<string, Object>} params.contentsByKey — contentKey → projection
 */
/**
 * Fold events into AffinityMap for a categoryNameMusic.
 * Login parity: ALL contentTypes in the category contribute to affinity / experienceCount.
 * contentType is ignored here — candidate pool is scoped separately in guestRecommendations.
 *
 * Trust catalog categoryNameMusic only (never forged event.c).
 */
const buildAffinityMapFromEvents = (
  events,
  {
    category,
    contentsByKey,
    nowMs = Date.now(),
    dims = dimensions,
    weights = scoringWeights,
  } = {}
) => {
  const cat = String(category || '').trim();
  /** @type {Map<string, { affinityScore: number, updatedAt: Date }>} */
  const cellMap = new Map();
  /** @type {Set<string>} */
  const listenedKeys = new Set();
  /** @type {Map<string, number>} */
  const priorByKey = new Map();
  /** @type {Set<string>} */
  const qualityKeys = new Set();
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
      listenedKeys,
      appliedEvents: 0,
    };
  }

  for (const event of events) {
    const key = toContentKey(event.ct, event.m);
    if (!key) continue;

    const content = contentsByKey.get(key);
    if (!content) continue;

    const contentCat = String(content.categoryNameMusic || '').trim();
    if (!contentCat || contentCat !== cat) continue;

    const valuesByType = extractAllDimensionValues(content, dims);
    const keys = collectDimensionKeys(valuesByType, dims);
    if (!keys.length) continue;

    const priorListenCount = priorByKey.get(key) || 0;
    const decayW = getDecayWeight(event.t, nowMs);
    if (decayW <= 0) continue;

    const baseBoost = resolveBoost(
      { completionRate: event.r, liked: false },
      priorListenCount,
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

    priorByKey.set(key, priorListenCount + 1);
    listenedKeys.add(key);
    appliedEvents += 1;

    if (event.r > qualityMin) {
      qualityKeys.add(key);
    }
  }

  /** @type {Object} */
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
    experienceCount: qualityKeys.size,
    listenedKeys,
    appliedEvents,
  };
};

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
    contentsByKey: options.contentsByKey || new Map(),
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
