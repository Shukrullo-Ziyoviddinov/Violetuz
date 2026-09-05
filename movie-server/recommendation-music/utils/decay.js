/**
 * Affinity time-decay + listen reinforcement (music dimensions).
 * Defaults to music scoringWeights — never movie config.
 *
 * @module recommendation-music/utils/decay
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { clamp } = require('../../recommendation/utils/clamp');

const MS_PER_DAY = 86_400_000;

/**
 * @param {Date|string|number|undefined|null} date
 * @param {number} [nowMs]
 * @returns {number}
 */
const daysSince = (date, nowMs = Date.now()) => {
  if (date === null || date === undefined || date === '') return 0;
  const t = date instanceof Date ? date.getTime() : new Date(date).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, (nowMs - t) / MS_PER_DAY);
};

/**
 * @param {number} score
 * @param {Date|string|number|undefined|null} updatedAt
 * @param {Object} [decay]
 * @param {number} [nowMs]
 * @returns {number}
 */
const applyDecay = (score, updatedAt, decay = scoringWeights.decay, nowMs = Date.now()) => {
  const current = typeof score === 'number' && !Number.isNaN(score) ? score : 0;
  if (current <= 0) return 0;

  const halfLife = Math.max(1, decay.halfLifeDays || 1);
  const ageDays = daysSince(updatedAt, nowMs);
  const factor = Math.pow(0.5, ageDays / halfLife);
  const decayed = current * factor;

  return clamp(Math.max(decayed, decay.minScore), decay.minScore, decay.maxScore);
};

/**
 * @param {{ completionRate?: number, liked?: boolean }} listenEvent
 * @param {Object} [decay]
 * @returns {number}
 */
const computeListenBoost = (listenEvent = {}, decay = scoringWeights.decay) => {
  const completion = clamp(listenEvent.completionRate ?? 0, 0, 1);
  let boost = decay.listenBoost * (1 + decay.completionWeight * completion);
  if (listenEvent.liked) {
    boost += decay.likedBoost;
  }
  return clamp(boost, 0, decay.maxScore);
};

/**
 * @param {number} boost
 * @param {Object} [weights]
 * @returns {number}
 */
const capListenBoost = (boost, weights = scoringWeights) => {
  const maxBoost =
    weights.duplicateListenCap *
    (weights.decay.listenBoost + weights.decay.likedBoost + weights.decay.completionWeight);
  return clamp(boost, 0, Math.max(0, maxBoost));
};

/**
 * @param {number} currentScore
 * @param {number} boost
 * @param {Object} [decay]
 * @param {Object} [weights]
 * @returns {number}
 */
const reinforceAffinity = (
  currentScore,
  boost,
  decay = scoringWeights.decay,
  weights = scoringWeights
) => {
  const base = typeof currentScore === 'number' && !Number.isNaN(currentScore) ? currentScore : 0;
  const applied = capListenBoost(boost, weights);
  return clamp(base + applied, decay.minScore, decay.maxScore);
};

/**
 * @param {Object} [input]
 * @param {number} [nowMs]
 * @param {Object} [decay]
 * @returns {import('../types/musicRecommendation.types').AffinityMap}
 */
const toDecayedAffinityMap = (input = {}, nowMs = Date.now(), decay = scoringWeights.decay) => {
  /** @type {import('../types/musicRecommendation.types').AffinityMap} */
  const out = {};

  for (const [dimType, values] of Object.entries(input || {})) {
    if (!values || typeof values !== 'object') continue;
    /** @type {Object.<string, number>} */
    const row = {};

    for (const [dimValue, cell] of Object.entries(values)) {
      if (typeof cell === 'number') {
        row[dimValue] = clamp(cell, 0, decay.maxScore);
        continue;
      }
      if (cell && typeof cell === 'object' && typeof cell.score === 'number') {
        row[dimValue] = applyDecay(cell.score, cell.updatedAt, decay, nowMs);
      }
    }

    out[dimType] = row;
  }

  return out;
};

module.exports = {
  daysSince,
  applyDecay,
  computeListenBoost,
  capListenBoost,
  reinforceAffinity,
  toDecayedAffinityMap,
};
