/**
 * Guest music listen history — domain store only (not shared with movies).
 * Key: violet_guest_music_v1
 * Compact rows: { m, c, ct, r, t }
 *   m  = content id
 *   c  = categoryNameMusic
 *   ct = contentType: music | album | clip | concert
 *   r  = completionRate 0..1
 *   t  = timestampMs
 *
 * Noise filter = music listen gate (≥10s / short 80%) at reporter — wired later.
 * Not wired to player / recommendations yet.
 */

import { createGuestHistoryStore } from './createGuestHistoryStore';
import { emitGuestMusicHistoryChanged } from './events';

export const MUSIC_GUEST_HISTORY_STORAGE_KEY = 'violet_guest_music_v1';

export const MUSIC_GUEST_CONTENT_TYPES = Object.freeze([
  'music',
  'album',
  'clip',
  'concert',
]);

const normalizeContentType = (ct) => {
  const raw = String(ct || '')
    .trim()
    .toLowerCase();
  if (raw === 'klip') return 'clip';
  if (raw === 'konsert') return 'concert';
  if (raw === 'musicalbom') return 'album';
  if (MUSIC_GUEST_CONTENT_TYPES.includes(raw)) return raw;
  return '';
};

const musicGuestHistoryStore = createGuestHistoryStore({
  storageKey: MUSIC_GUEST_HISTORY_STORAGE_KEY,
  minCompletionRate: 0,
  // One row per contentType × contentId (same id, different types allowed)
  getEntryKey: (entry) => {
    const m = entry?.m != null ? String(entry.m) : '';
    const ct = normalizeContentType(entry?.ct);
    if (!m || !ct) return '';
    return `${ct}:${m}`;
  },
});

/**
 * @param {string|number} contentId
 * @param {string} category — categoryNameMusic
 * @param {number} completionRate
 * @param {string} contentType — music | album | clip | concert
 */
export const addListenEvent = (contentId, category, completionRate, contentType) => {
  const ct = normalizeContentType(contentType);
  if (!ct) return false;
  const ok = musicGuestHistoryStore.addWatchEvent(contentId, category, completionRate, {
    ct,
  });
  if (ok) emitGuestMusicHistoryChanged();
  return ok;
};

/** Alive compact entries: [{ m, c, ct, r, t }, ...] */
export const getListenHistory = () =>
  musicGuestHistoryStore
    .getWatchHistory()
    .map((e) => ({
      ...e,
      ct: normalizeContentType(e.ct),
    }))
    .filter((e) => e.ct);

/** Full wipe (register / logout — never merge into DB). */
export const clearListenHistory = () => {
  musicGuestHistoryStore.clearWatchHistory();
  emitGuestMusicHistoryChanged();
};

export const getDecayWeight = (timestampMs, nowMs) =>
  musicGuestHistoryStore.getDecayWeight(timestampMs, nowMs);

export const musicGuestHistoryConfig = musicGuestHistoryStore.config;

export default musicGuestHistoryStore;
