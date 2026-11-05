// Sampling policy only. Recommendation weights live in the isolated server module.
export const TRAILER_WATCH_CONFIG = Object.freeze({
  recommendedSampleIntervalMs: 250,
  maxSampleGapMs: 2000,
  clockToleranceSeconds: 0.15,
  clockToleranceRatio: 0.1,
  intervalEpsilonSeconds: 0.000001,
});
