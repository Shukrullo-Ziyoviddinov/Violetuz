/**
 * Listen-progress rules (pure) — music / album / clip / concert.
 *
 * Model:
 *   1) GATE (≥10s yoki qisqa trek ~80%) → "tinglandi" ochiladi
 *   2) COMPLETION (0..1) → affinity boost kuchi
 *      boost = listenBoost * (1 + completionWeight * completionRate)
 *   3) Storage:
 *      - music | clip | concert → bitta timeline, MAX(listenedSeconds, completionRate)
 *      - album → har trek MAX, jami = sum(trackSeconds); completion = jami / albumDuration
 *
 * 10s faqat eshik — 20s eshitib tashlash ≈ past completion;
 * 60% / 90% / 100% → genre/country/language/artist affinity shuncha kuchli.
 *
 * @module recommendation-music/utils/progressRules
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');

const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0));

/**
 * @param {Object} [cfg]
 * @returns {{ minSec: number, shortRatio: number, affinityMinDelta: number }}
 */
const getProgressConfig = (cfg = scoringWeights.progress) => ({
  minSec: cfg?.minListenedSeconds ?? 10,
  shortRatio: cfg?.shortCompleteRatio ?? 0.8,
  affinityMinDelta: cfg?.affinityMinDelta ?? 0.1,
});

/**
 * Birinchi "tinglandi" eshigi (ContentView + affinity boshlanishi).
 *
 * @param {number} listenedSeconds
 * @param {number} [completionRate]
 * @param {number|null} [durationSec]
 * @param {Object} [cfg]
 * @returns {boolean}
 */
const isListenGateOpen = (
  listenedSeconds,
  completionRate = 0,
  durationSec = null,
  cfg = scoringWeights.progress
) => {
  const { minSec, shortRatio } = getProgressConfig(cfg);
  const listened = Math.max(0, Number(listenedSeconds) || 0);
  const completion = clamp01(completionRate);

  if (listened >= minSec) return true;

  if (
    Number.isFinite(durationSec) &&
    durationSec > 0 &&
    durationSec < minSec &&
    (listened >= durationSec * shortRatio || completion >= shortRatio)
  ) {
    return true;
  }

  return false;
};

/**
 * @param {number} listenedSeconds
 * @param {number|null|undefined} durationSec
 * @param {number} [explicitCompletion]
 * @returns {number} 0..1
 */
const resolveCompletionRate = (listenedSeconds, durationSec, explicitCompletion) => {
  if (
    explicitCompletion != null &&
    Number.isFinite(Number(explicitCompletion))
  ) {
    return clamp01(explicitCompletion);
  }
  if (Number.isFinite(durationSec) && durationSec > 0) {
    return clamp01(listenedSeconds / durationSec);
  }
  return 0;
};

/**
 * Affinity qayta yozilsinmi? (completion sezilarli oshganda)
 *
 * @param {Object} progress
 * @param {Object} [cfg]
 * @returns {boolean}
 */
const shouldQueueAffinity = (progress, cfg = scoringWeights.progress) => {
  if (!progress) return false;
  const { minSec, affinityMinDelta } = getProgressConfig(cfg);
  const listened = Number(progress.listenedSeconds) || 0;
  if (listened < minSec) return false;

  const last =
    typeof progress.lastAffinityCompletion === 'number'
      ? progress.lastAffinityCompletion
      : -1;
  const completion = clamp01(progress.completionRate);

  return last < 0 || completion - last >= affinityMinDelta - 1e-9;
};

/**
 * Client/API javob uchun progress snapshot.
 * @param {Object} progress
 */
const toProgressClientPayload = (progress) => {
  if (!progress) return null;

  let trackSeconds;
  if (progress.trackSeconds) {
    trackSeconds =
      progress.trackSeconds instanceof Map
        ? Object.fromEntries(progress.trackSeconds)
        : { ...progress.trackSeconds };
  }

  return {
    contentKey: progress.contentKey,
    contentType: progress.contentType,
    contentId: progress.contentId,
    category: progress.category,
    listenedSeconds: progress.listenedSeconds,
    completionRate: progress.completionRate,
    albumDurationSec: progress.albumDurationSec ?? null,
    trackSeconds,
    updatedAt: progress.updatedAt,
  };
};

/**
 * Albom: birinchi eshik ochilganmi yoki yangi trek delta qabul qilinsinmi.
 *
 * @param {Object|null} existingProgress
 * @param {number} trackListenedSeconds
 * @param {number|null} trackDurationSec
 * @param {Object} [cfg]
 */
const isAlbumReportAcceptable = (
  existingProgress,
  trackListenedSeconds,
  trackDurationSec,
  cfg = scoringWeights.progress
) => {
  const { minSec } = getProgressConfig(cfg);
  const trackSec = Math.max(0, Number(trackListenedSeconds) || 0);

  if (isListenGateOpen(trackSec, 0, trackDurationSec, cfg)) return true;

  const existingTotal = Number(existingProgress?.listenedSeconds) || 0;
  if (existingTotal >= minSec && trackSec > 0) return true;
  if (existingProgress && trackSec > 0) return true;

  return false;
};

module.exports = {
  clamp01,
  getProgressConfig,
  isListenGateOpen,
  resolveCompletionRate,
  shouldQueueAffinity,
  toProgressClientPayload,
  isAlbumReportAcceptable,
  /** @deprecated alias — verify skriptlari uchun */
  isEligibleProgress: isListenGateOpen,
};
