/**
 * Parda videosining ko‘rilgan foizi.
 * Eng uzoq nuqta saqlanadi. Kino daqiqasiga yozilmaydi.
 */

const STEP = 0.05;

const clamp01 = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(1, Math.max(0, num));
};

/**
 * @param {{ high: number, duration: number, rate: number }|null|undefined} previous
 * @param {number} currentTime
 * @param {number} durationSec
 */
export const nextTrillerSample = (previous, currentTime, durationSec) => {
  const time = Number(currentTime);
  const duration = Number(durationSec);
  if (!Number.isFinite(time) || time <= 0) return previous || null;
  if (!Number.isFinite(duration) || duration <= 0) return previous || null;
  const high = Math.max(Number(previous?.high) || 0, time);
  const rate = clamp01(high / duration);
  return { high, duration, rate };
};

/**
 * @param {number} lastSent
 * @param {number} rate
 * @param {boolean} [force]
 */
export const shouldSendTrillerRate = (lastSent, rate, force = false) => {
  const next = clamp01(rate);
  if (next <= 0) return false;
  const last = clamp01(lastSent);
  if (next <= last + 1e-9) return false;
  if (force) return true;
  return next >= last + STEP - 1e-9;
};

export const TRILLER_REPORT_STEP = STEP;
