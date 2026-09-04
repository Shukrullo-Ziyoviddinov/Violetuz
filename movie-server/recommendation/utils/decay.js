/**
 * Affinity time-decay + watch reinforcement (all dimension types).
 * Never drives scores to ±Infinity; always clamp to [minScore, maxScore].
 *
 * @module recommendation/utils/decay
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { clamp } = require('./clamp');

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
 * Exponential half-life decay. Positive scores never fall below minScore (soft fade).
 *
 * @param {number} score
 * @param {Date|string|number|undefined|null} updatedAt
 * @param {import('../types/recommendation.types').DecayConfig} [decay]
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
 * Boost amount from a single watch event (before duplicate cap).
 *
 * @param {{ completionRate?: number, liked?: boolean }} watchEvent
 * @param {import('../types/recommendation.types').DecayConfig} [decay]
 * @returns {number}
 */
const computeWatchBoost = (watchEvent = {}, decay = scoringWeights.decay) => {
  const completion = clamp(watchEvent.completionRate ?? 0, 0, 1);
  let boost = decay.watchBoost * (1 + decay.completionWeight * completion);
  if (watchEvent.liked) {
    boost += decay.likedBoost;
  }
  return clamp(boost, 0, decay.maxScore);
};

/**
 * Cap a single-event boost so duplicate watches cannot explode affinity.
 *
 * @param {number} boost
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [weights]
 * @returns {number}
 */
const capWatchBoost = (boost, weights = scoringWeights) => {
  const maxBoost =
    weights.duplicateWatchCap *
    (weights.decay.watchBoost + weights.decay.likedBoost + weights.decay.completionWeight);
  return clamp(boost, 0, Math.max(0, maxBoost));
};

/**
 * Apply boost on top of (optionally decayed) current score, then clamp.
 *
 * @param {number} currentScore
 * @param {number} boost
 * @param {import('../types/recommendation.types').DecayConfig} [decay]
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [weights]
 * @returns {number}
 */
const reinforceAffinity = (
  currentScore,
  boost,
  decay = scoringWeights.decay,
  weights = scoringWeights
) => {
  const base = typeof currentScore === 'number' && !Number.isNaN(currentScore) ? currentScore : 0;
  const applied = capWatchBoost(boost, weights);
  return clamp(base + applied, decay.minScore, decay.maxScore);
};

/**
 * Normalize affinity input to a plain AffinityMap, applying decay when meta is present.
 *
 * Accepts:
 *   { genre: { Jangari: 2 } }
 *   { genre: { Jangari: { score: 2, updatedAt: '...' } } }
 *
 * @param {import('../types/recommendation.types').AffinityMap|Object} [input]
 * @param {number} [nowMs]
 * @param {import('../types/recommendation.types').DecayConfig} [decay]
 * @returns {import('../types/recommendation.types').AffinityMap}
 */
const toDecayedAffinityMap = (input = {}, nowMs = Date.now(), decay = scoringWeights.decay) => {
  /** @type {import('../types/recommendation.types').AffinityMap} */
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
  computeWatchBoost,
  capWatchBoost,
  reinforceAffinity,
  toDecayedAffinityMap,
};
