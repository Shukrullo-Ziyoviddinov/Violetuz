/**
 * Guest movie watch history — domain store only.
 * Key: violet_guest_movies_v1 (not shared with music).
 *
 * Noise filter for movies = WatchModal isEligibleWatch (≥5 min / short 80%),
 * same gate as login progress — not MIN_COMPLETION_RATE (long films would
 * otherwise stay below 0.15 after the time gate).
 */

import { createGuestHistoryStore } from './createGuestHistoryStore';
import { emitGuestMovieHistoryChanged } from './events';

export const MOVIE_GUEST_HISTORY_STORAGE_KEY = 'violet_guest_movies_v1';

const movieGuestHistoryStore = createGuestHistoryStore({
  storageKey: MOVIE_GUEST_HISTORY_STORAGE_KEY,
  minCompletionRate: 0,
  // Duplicate identity: one row per movieId
  getEntryKey: (entry) => String(entry?.m ?? ''),
});

/** @param {string|number} movieId @param {string} category @param {number} completionRate */
export const addWatchEvent = (movieId, category, completionRate) => {
  const ok = movieGuestHistoryStore.addWatchEvent(movieId, category, completionRate);
  if (ok) emitGuestMovieHistoryChanged();
  return ok;
};

/** Alive compact entries: [{ m, c, r, t }, ...] */
export const getWatchHistory = () => movieGuestHistoryStore.getWatchHistory();

/** Full wipe (call on successful register — never merge into DB). */
export const clearWatchHistory = () => {
  movieGuestHistoryStore.clearWatchHistory();
  emitGuestMovieHistoryChanged();
};

/** Time-decay weight for one event timestamp (guestAffinityBuilder later). */
export const getDecayWeight = (timestampMs, nowMs) =>
  movieGuestHistoryStore.getDecayWeight(timestampMs, nowMs);

export const movieGuestHistoryConfig = movieGuestHistoryStore.config;

export default movieGuestHistoryStore;
