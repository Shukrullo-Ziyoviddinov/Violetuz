/**
 * Confidence-based blending — consumer of scoring + trending (does NOT mutate them).
 *
 * Before blend, personal (~5–20) and trending (0–1) are brought to the same [0,1]
 * scale (pool min-max), then:
 *   blended = alpha * normPersonal + (1 - alpha) * normTrending
 *
 * @module recommendation/services/blending.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { clamp, normalize01 } = require('../utils/clamp');
const { scoreMovie } = require('./scoring.service');
const { resolveTrendingScore } = require('./trending.service');
const { getUserExperienceCount } = require('../repositories/userExperience.repository');
const { getTrendingScoreMap } = require('../repositories/trending.repository');

/**
 * calculateAlpha(experienceCount)
 *
 * linear:      min(1, count / confidenceThreshold)
 * exponential: 1 - exp(-count / confidenceK)
 *
 * @param {number} experienceCount
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [weights]
 * @returns {number} 0..1
 */
const calculateAlpha = (experienceCount, weights = scoringWeights) => {
  const blend = weights.blend || {};
  const count = Math.max(0, Number(experienceCount) || 0);
  const strategy = String(blend.strategy || 'linear').toLowerCase();

  let alpha = 0;

  if (strategy === 'exponential') {
    const k = Math.max(1e-6, Number(blend.confidenceK) || 10);
    alpha = 1 - Math.exp(-count / k);
  } else {
    const threshold = Math.max(1e-6, Number(blend.confidenceThreshold) || 20);
    alpha = count / threshold;
  }

  return clamp(alpha, 0, 1);
};

/**
 * Pure blend of two (already comparable) scores.
 *
 * @param {number} personalizedScore
 * @param {number} trendingScore
 * @param {number} alpha — 0..1 (will be clamped)
 * @returns {number}
 */
const blendScores = (personalizedScore, trendingScore, alpha) => {
  const a = clamp(alpha, 0, 1);
  const p =
    typeof personalizedScore === 'number' && !Number.isNaN(personalizedScore)
      ? personalizedScore
      : 0;
  const t =
    typeof trendingScore === 'number' && !Number.isNaN(trendingScore)
      ? trendingScore
      : 0;
  return a * p + (1 - a) * t;
};

/**
 * Min-max normalize a numeric list to [0,1] (same length).
 * All equal → 0.5 if > 0, else 0 (no false ranking spread).
 *
 * @param {number[]} values
 * @returns {number[]}
 */
const minMaxNormalizeList = (values) => {
  if (!Array.isArray(values) || !values.length) return [];

  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    const n = typeof v === 'number' && !Number.isNaN(v) ? v : 0;
    if (n < min) min = n;
    if (n > max) max = n;
  }

  if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) {
    const flat = max > 0 || min > 0 ? 0.5 : 0;
    return values.map(() => flat);
  }

  return values.map((v) => {
    const n = typeof v === 'number' && !Number.isNaN(v) ? v : 0;
    return normalize01(n, min, max);
  });
};

/**
 * Soft-cap personal score to [0,1] when no candidate pool (single-movie path).
 *
 * @param {number} personalScore
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [weights]
 * @returns {number}
 */
const normalizePersonalLone = (personalScore, weights = scoringWeights) => {
  const cap = Math.max(1e-6, Number(weights.blend?.personalNormCap) || 20);
  return clamp((Number(personalScore) || 0) / cap, 0, 1);
};

/**
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [weights]
 * @returns {boolean}
 */
const shouldNormalize = (weights = scoringWeights) => {
  const mode = String(weights.blend?.normalizeMode || 'minmax').toLowerCase();
  return mode !== 'none';
};

/**
 * Single movie blended score.
 * Without a pool, personal is soft-capped to [0,1]; trending already ~[0,1].
 *
 * @param {Object} params
 * @returns {Promise<Object>}
 */
const getBlendedScore = async (params = {}) => {
  const {
    movie,
    category,
    experienceCount: experienceInput,
    userId = null,
    trendingScore: trendingInput = null,
    scoreOptions = {},
    includeBreakdown = false,
    weights = scoringWeights,
  } = params;

  let experienceCount = experienceInput;
  if (experienceCount == null && userId && category) {
    experienceCount = await getUserExperienceCount(userId, category);
  }
  experienceCount = Math.max(0, Number(experienceCount) || 0);

  const alpha = calculateAlpha(experienceCount, weights);

  const personal = scoreMovie(movie, {
    ...scoreOptions,
    includeBreakdown,
    weights,
  });

  const resolved = resolveTrendingScore(trendingInput, movie, weights);

  const normPersonal = shouldNormalize(weights)
    ? normalizePersonalLone(personal.score, weights)
    : personal.score;
  const normTrending = shouldNormalize(weights)
    ? clamp(resolved.score, 0, 1)
    : resolved.score;

  const blended = blendScores(normPersonal, normTrending, alpha);

  /** @type {Object} */
  const result = {
    movie,
    score: blended,
    alpha,
    experienceCount,
    personalizedScore: personal.score,
    trendingScore: resolved.score,
    normalizedPersonalizedScore: normPersonal,
    normalizedTrendingScore: normTrending,
    trendingSource: resolved.source,
    coldStart: personal.coldStart,
  };

  if (includeBreakdown && personal.breakdown) {
    result.breakdown = {
      ...personal.breakdown,
      alpha,
      personalizedScore: personal.score,
      trendingScore: resolved.score,
      normalizedPersonalizedScore: normPersonal,
      normalizedTrendingScore: normTrending,
      trendingSource: resolved.source,
      final: blended,
    };
  }

  return result;
};

/**
 * Batch blend for a category candidate pool (one experience COUNT + one trending map).
 * Min-max normalizes personal and trending **within the pool** before blending.
 *
 * @param {import('../types/recommendation.types').Movie[]} movies
 * @param {Object} options
 * @returns {Promise<Array<Object>>} sorted by blended score DESC
 */
const scoreMoviesBlended = async (movies, options = {}) => {
  if (!Array.isArray(movies) || !movies.length) return [];

  const {
    userId,
    category,
    scoreOptions = {},
    weights = scoringWeights,
  } = options;

  const cat = String(category || '').trim();

  let experienceCount = options.experienceCount;
  if (experienceCount == null && userId && cat) {
    experienceCount = await getUserExperienceCount(userId, cat);
  }
  experienceCount = Math.max(0, Number(experienceCount) || 0);
  const alpha = calculateAlpha(experienceCount, weights);

  let trendingMap = options.trendingMap;
  if (!trendingMap) {
    trendingMap = await getTrendingScoreMap(
      cat,
      movies.map((m) => m.id)
    );
  }

  const raw = movies.map((movie) => {
    const personal = scoreMovie(movie, { ...scoreOptions, weights });
    const stored = trendingMap.get(String(movie.id));
    const resolved = resolveTrendingScore(
      stored === undefined ? null : stored,
      movie,
      weights
    );

    return {
      movie,
      personalizedScore: personal.score,
      trendingScore: resolved.score,
      trendingSource: resolved.source,
      coldStart: personal.coldStart,
    };
  });

  const normPersonalList = shouldNormalize(weights)
    ? minMaxNormalizeList(raw.map((r) => r.personalizedScore))
    : raw.map((r) => r.personalizedScore);

  const normTrendingList = shouldNormalize(weights)
    ? minMaxNormalizeList(raw.map((r) => r.trendingScore))
    : raw.map((r) => r.trendingScore);

  const scored = raw.map((row, i) => {
    const normPersonal = normPersonalList[i];
    const normTrending = normTrendingList[i];
    const blended = blendScores(normPersonal, normTrending, alpha);

    return {
      movie: row.movie,
      score: blended,
      alpha,
      experienceCount,
      personalizedScore: row.personalizedScore,
      trendingScore: row.trendingScore,
      normalizedPersonalizedScore: normPersonal,
      normalizedTrendingScore: normTrending,
      trendingSource: row.trendingSource,
      coldStart: row.coldStart,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
};

module.exports = {
  calculateAlpha,
  blendScores,
  minMaxNormalizeList,
  normalizePersonalLone,
  getBlendedScore,
  scoreMoviesBlended,
};
