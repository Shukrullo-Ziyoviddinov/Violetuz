/**
 * Guest music localHistory limits — mirrors FE guestHistory + movie guest config.
 *
 * @module recommendation-music/config/guestHistory.config
 */

'use strict';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const guestHistoryConfig = Object.freeze({
  MAX_ENTRIES: 150,
  MAX_AGE_DAYS: 60,
  DECAY_HALF_LIFE_DAYS: 20,
  /** Store floor; α uses scoringWeights.blend.qualityMinCompletion */
  MIN_COMPLETION_RATE: 0,
});

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
