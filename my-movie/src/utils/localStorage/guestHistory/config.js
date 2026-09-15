/**
 * Guest localStorage history defaults (shared by movie / music / future domains).
 *
 * Memory note (~40–50 B/entry × 150 ≈ 7 KB ≪ 5 MB localStorage):
 * 1) Rolling window (MAX_ENTRIES / FIFO)
 * 2) Duplicate upsert (same key → refresh t/r, no second row)
 * 3) MIN_COMPLETION_RATE noise filter
 * 4) QuotaExceeded → halve + retry; private mode → silent no-op → trending-only
 * Soft age: MAX_AGE_DAYS hard drop + DECAY_HALF_LIFE_DAYS smooth weight decay.
 */

export const DEFAULT_GUEST_HISTORY_CONFIG = Object.freeze({
  MAX_ENTRIES: 150,
  MAX_AGE_DAYS: 60,
  DECAY_HALF_LIFE_DAYS: 20,
  MIN_COMPLETION_RATE: 0.15,
});

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
