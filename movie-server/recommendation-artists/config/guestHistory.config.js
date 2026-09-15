/**
 * Guest localHistory limits for recommended-artists.
 * Mirrors FE music guestHistory + recommendation-music/config/guestHistory.config
 * (same store: violet_guest_music_v1). Server validates independently.
 *
 * @module recommendation-artists/config/guestHistory.config
 */

'use strict';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const guestHistoryConfig = Object.freeze({
  MAX_ENTRIES: 150,
  MAX_AGE_DAYS: 60,
  DECAY_HALF_LIFE_DAYS: 20,
  /**
   * Store floor — FE listen gate (≥10s / short 80%) is primary noise filter.
   * Artist minScore (≥2 distinct contents) is applied later in the score builder.
   */
  MIN_COMPLETION_RATE: 0,
});

/**
 * Smooth time decay (same curve as music guest / FE getDecayWeight).
 * Artist distinct-count does not use decay for score; kept for parity / future.
 *
 * @param {number} timestampMs
 * @param {number} [nowMs]
 * @param {typeof guestHistoryConfig} [cfg]
 * @returns {number} 0..1
 */
const getDecayWeight = (
  timestampMs,
  nowMs = Date.now(),
  cfg = guestHistoryConfig
) => {
  const t = Number(timestampMs);
  if (!Number.isFinite(t)) return 0;
  const ageDays = (nowMs - t) / MS_PER_DAY;
  if (ageDays > cfg.MAX_AGE_DAYS) return 0;
  if (ageDays <= 0) return 1;
  return Math.exp(-ageDays / cfg.DECAY_HALF_LIFE_DAYS);
};

module.exports = {
  MS_PER_DAY,
  guestHistoryConfig,
  getDecayWeight,
};
