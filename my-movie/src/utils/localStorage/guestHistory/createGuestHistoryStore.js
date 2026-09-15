import {
  DEFAULT_GUEST_HISTORY_CONFIG,
  MS_PER_DAY,
} from './config';

/**
 * Domain-scoped guest watch/listen history factory.
 * Does not touch recommendation APIs or login flows — storage only.
 *
 * @param {object} options
 * @param {string} options.storageKey  Required distinct key per domain (e.g. violet_guest_movies_v1)
 * @param {number} [options.maxEntries]
 * @param {number} [options.maxAgeDays]
 * @param {number} [options.decayHalfLifeDays]
 * @param {number} [options.minCompletionRate]
 * @param {(entry: object) => string} [options.getEntryKey]  Duplicate identity (default: entry.m)
 */
export function createGuestHistoryStore(options = {}) {
  const storageKey = options.storageKey;
  if (!storageKey || typeof storageKey !== 'string') {
    throw new Error('createGuestHistoryStore: storageKey is required');
  }

  const maxEntries = options.maxEntries ?? DEFAULT_GUEST_HISTORY_CONFIG.MAX_ENTRIES;
  const maxAgeDays = options.maxAgeDays ?? DEFAULT_GUEST_HISTORY_CONFIG.MAX_AGE_DAYS;
  const decayHalfLifeDays =
    options.decayHalfLifeDays ?? DEFAULT_GUEST_HISTORY_CONFIG.DECAY_HALF_LIFE_DAYS;
  const minCompletionRate =
    options.minCompletionRate ?? DEFAULT_GUEST_HISTORY_CONFIG.MIN_COMPLETION_RATE;
  const getEntryKey =
    typeof options.getEntryKey === 'function'
      ? options.getEntryKey
      : (entry) => String(entry?.m ?? '');

  const getDecayWeight = (timestampMs, nowMs = Date.now()) => {
    const t = Number(timestampMs);
    if (!Number.isFinite(t)) return 0;
    const ageDays = (nowMs - t) / MS_PER_DAY;
    if (ageDays > maxAgeDays) return 0;
    if (ageDays <= 0) return 1;
    return Math.exp(-ageDays / decayHalfLifeDays);
  };

  const isStorageAvailable = () => {
    try {
      return typeof localStorage !== 'undefined' && localStorage != null;
    } catch {
      return false;
    }
  };

  const readRaw = () => {
    if (!isStorageAvailable()) return [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeRaw = (entries) => {
    if (!isStorageAvailable()) return false;
    try {
      localStorage.setItem(storageKey, JSON.stringify(entries));
      return true;
    } catch (err) {
      const name = err && err.name;
      if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        return 'quota';
      }
      return false;
    }
  };

  const pruneExpired = (entries, nowMs = Date.now()) => {
    const cutoff = nowMs - maxAgeDays * MS_PER_DAY;
    return entries.filter((e) => {
      const t = Number(e?.t);
      return Number.isFinite(t) && t >= cutoff;
    });
  };

  const enforceMaxEntries = (entries) => {
    if (entries.length <= maxEntries) return entries;
    // FIFO: drop oldest by timestamp
    const sorted = [...entries].sort((a, b) => Number(a.t) - Number(b.t));
    return sorted.slice(sorted.length - maxEntries);
  };

  const sanitizeEntry = (entry) => {
    if (!entry || entry.m == null || entry.m === '') return null;
    const r = Number(entry.r);
    const t = Number(entry.t);
    if (!Number.isFinite(r) || !Number.isFinite(t)) return null;
    const out = {
      m: entry.m,
      c: entry.c != null ? String(entry.c) : '',
      r,
      t,
    };
    // Preserve domain extras (e.g. music contentType) without requiring them here
    if (entry.ct != null) out.ct = entry.ct;
    return out;
  };

  /**
   * Alive entries only (age-pruned). Compact shape: { m, c, r, t[, ct] }.
   */
  const getWatchHistory = () => {
    const nowMs = Date.now();
    return pruneExpired(readRaw(), nowMs)
      .map(sanitizeEntry)
      .filter(Boolean);
  };

  const persist = (entries) => {
    let next = enforceMaxEntries(entries);
    let result = writeRaw(next);
    if (result === 'quota') {
      // Layer 4: halve and retry once
      next = enforceMaxEntries(next.slice(Math.floor(next.length / 2)));
      result = writeRaw(next);
      if (result === 'quota' || result === false) {
        // Silent fail — guest recs fall back to trending-only
        return false;
      }
    }
    return result !== false;
  };

  /**
   * @param {string|number} mediaId
   * @param {string} category
   * @param {number} completionRate  0..1
   * @param {object} [extra]         Optional domain fields (e.g. { ct: 'clip' })
   */
  const addWatchEvent = (mediaId, category, completionRate, extra = undefined) => {
    const rate = Number(completionRate);
    if (!Number.isFinite(rate) || rate < minCompletionRate) {
      return false;
    }
    if (mediaId == null || mediaId === '') {
      return false;
    }

    const nowMs = Date.now();
    let entries = pruneExpired(readRaw(), nowMs).map(sanitizeEntry).filter(Boolean);

    const candidate = sanitizeEntry({
      m: mediaId,
      c: category != null ? String(category) : '',
      r: rate,
      t: nowMs,
      ...(extra && typeof extra === 'object' ? extra : {}),
    });
    if (!candidate) return false;

    const key = getEntryKey(candidate);
    if (!key) return false;

    const idx = entries.findIndex((e) => getEntryKey(e) === key);
    if (idx >= 0) {
      // Upsert: refresh timestamp + keep strongest completion signal
      const prev = entries[idx];
      entries[idx] = {
        ...prev,
        ...candidate,
        r: Math.max(Number(prev.r) || 0, rate),
        t: nowMs,
      };
    } else {
      entries.push(candidate);
    }

    entries = enforceMaxEntries(entries);
    return persist(entries);
  };

  const clearWatchHistory = () => {
    if (!isStorageAvailable()) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  return {
    storageKey,
    config: Object.freeze({
      maxEntries,
      maxAgeDays,
      decayHalfLifeDays,
      minCompletionRate,
    }),
    addWatchEvent,
    getWatchHistory,
    clearWatchHistory,
    getDecayWeight,
  };
}
