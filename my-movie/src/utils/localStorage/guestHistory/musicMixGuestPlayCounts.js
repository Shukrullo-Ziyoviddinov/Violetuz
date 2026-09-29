/**
 * Guest mix play counts — local only (never merged into DB).
 * Key: violet_guest_music_mix_plays_v1
 *
 * Alohida ledger: violet_guest_music_v1 (rec listen) ga tegilmaydi.
 * Server music_mix_play_counts bilan bir xil g‘oya:
 *   bitta contentType × contentId → bitta qator
 *   bir sessionId → bir marta (+1), yangi sessiya → yana +1
 *
 * Compact rows: { ct, m, g, p, s, t }
 *   ct = contentType: music | klip
 *   m  = contentId
 *   g  = genre (bo‘sh bo‘lishi mumkin — keyin catalogdan)
 *   p  = playCount
 *   s  = lastSessionId
 *   t  = lastPlayedAt (ms)
 */

import { DEFAULT_GUEST_HISTORY_CONFIG, MS_PER_DAY } from './config';
import { emitGuestMusicMixPlaysChanged } from './events';

export const MUSIC_MIX_GUEST_PLAYS_STORAGE_KEY = 'violet_guest_music_mix_plays_v1';

export const MIX_GUEST_CONTENT_TYPES = Object.freeze(['music', 'klip']);

const MAX_ENTRIES = DEFAULT_GUEST_HISTORY_CONFIG.MAX_ENTRIES;
const MAX_AGE_DAYS = DEFAULT_GUEST_HISTORY_CONFIG.MAX_AGE_DAYS;

const normalizeContentType = (value) => {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  if (raw === 'clip' || raw === 'klip') return 'klip';
  if (raw === 'music') return 'music';
  return '';
};

const entryKey = (ct, contentId) => {
  const type = normalizeContentType(ct);
  const id = contentId == null ? '' : String(contentId).trim();
  if (!type || !id) return '';
  return `${type}:${id}`;
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
    const raw = localStorage.getItem(MUSIC_MIX_GUEST_PLAYS_STORAGE_KEY);
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
    localStorage.setItem(MUSIC_MIX_GUEST_PLAYS_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (err) {
    const name = err && err.name;
    if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      return 'quota';
    }
    return false;
  }
};

const sanitizeEntry = (entry) => {
  const ct = normalizeContentType(entry?.ct);
  const m = entry?.m == null ? '' : String(entry.m).trim();
  const p = Number(entry?.p);
  const t = Number(entry?.t);
  if (!ct || !m || !Number.isFinite(p) || p < 1 || !Number.isFinite(t)) return null;
  const s = entry?.s != null ? String(entry.s).trim() : '';
  const g = entry?.g != null ? String(entry.g).trim() : '';
  return { ct, m, g, p: Math.floor(p), s, t };
};

const pruneExpired = (entries, nowMs = Date.now()) => {
  const cutoff = nowMs - MAX_AGE_DAYS * MS_PER_DAY;
  return entries.filter((e) => {
    const t = Number(e?.t);
    return Number.isFinite(t) && t >= cutoff;
  });
};

const enforceMaxEntries = (entries) => {
  if (entries.length <= MAX_ENTRIES) return entries;
  const sorted = [...entries].sort((a, b) => Number(a.t) - Number(b.t));
  return sorted.slice(sorted.length - MAX_ENTRIES);
};

const persist = (entries) => {
  let next = enforceMaxEntries(entries);
  let result = writeRaw(next);
  if (result === 'quota') {
    next = enforceMaxEntries(next.slice(Math.floor(next.length / 2)));
    result = writeRaw(next);
    if (result === 'quota' || result === false) return false;
  }
  return result !== false;
};

/**
 * Alive rows (age-pruned): [{ ct, m, g, p, s, t }, ...]
 */
export const getMixPlayCounts = () =>
  pruneExpired(readRaw())
    .map(sanitizeEntry)
    .filter(Boolean);

/**
 * Bir sessiya bir marta. Yangi sessionId → playCount +1.
 * @returns {{ counted: boolean, sameSession: boolean, entry: object|null }}
 */
export const recordMixPlay = ({
  contentId,
  contentType = 'music',
  sessionId,
  genre = '',
  playedAt = Date.now(),
} = {}) => {
  const ct = normalizeContentType(contentType);
  const m = contentId == null ? '' : String(contentId).trim();
  const s = sessionId == null ? '' : String(sessionId).trim();
  const g = genre != null ? String(genre).trim() : '';
  const t = Number(playedAt);
  const key = entryKey(ct, m);

  if (!key || !s || !Number.isFinite(t)) {
    return { counted: false, sameSession: false, entry: null };
  }

  let entries = pruneExpired(readRaw(), t).map(sanitizeEntry).filter(Boolean);
  const idx = entries.findIndex((e) => entryKey(e.ct, e.m) === key);

  if (idx >= 0) {
    const prev = entries[idx];
    if (prev.s && prev.s === s) {
      return { counted: false, sameSession: true, entry: prev };
    }
    const next = {
      ...prev,
      g: g || prev.g || '',
      p: prev.p + 1,
      s,
      t,
    };
    entries[idx] = next;
    if (!persist(entries)) {
      return { counted: false, sameSession: false, entry: null };
    }
    emitGuestMusicMixPlaysChanged();
    return { counted: true, sameSession: false, entry: next };
  }

  const created = { ct, m, g, p: 1, s, t };
  entries.push(created);
  if (!persist(entries)) {
    return { counted: false, sameSession: false, entry: null };
  }
  emitGuestMusicMixPlaysChanged();
  return { counted: true, sameSession: false, entry: created };
};

/**
 * Full wipe — login / register / logout / session restore.
 * Privacy: guest mix counts never merge into DB (AuthContext setAuthSession + logout).
 */
export const clearMixPlayCounts = () => {
  if (!isStorageAvailable()) return;
  try {
    localStorage.removeItem(MUSIC_MIX_GUEST_PLAYS_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  emitGuestMusicMixPlaysChanged();
};

export const musicMixGuestPlayCountsConfig = Object.freeze({
  storageKey: MUSIC_MIX_GUEST_PLAYS_STORAGE_KEY,
  maxEntries: MAX_ENTRIES,
  maxAgeDays: MAX_AGE_DAYS,
  contentTypes: MIX_GUEST_CONTENT_TYPES,
});

export default {
  storageKey: MUSIC_MIX_GUEST_PLAYS_STORAGE_KEY,
  recordMixPlay,
  getMixPlayCounts,
  clearMixPlayCounts,
  config: musicMixGuestPlayCountsConfig,
};
