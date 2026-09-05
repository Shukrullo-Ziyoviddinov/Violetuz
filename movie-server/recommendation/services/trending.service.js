/**
 * Category trending score formula (pure — no DB I/O).
 *
 * trendingScore =
 *   wViews * normalize(views) +
 *   wAvgDuration * normalize(avgDuration) +
 *   wLikes * normalize(likes) +
 *   wCompletion * completionRateAvg   // already 0..1
 *
 * Normalization is min-max within the category batch (0..1).
 * Empty / missing trending → optional popularity fallback (caller / blending).
 *
 * @module recommendation/services/trending.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { clamp, normalize01 } = require('../utils/clamp');
const { getPopularitySignal } = require('../utils/movieSignals');

/**
 * @param {number[]} values
 * @returns {{ min: number, max: number }}
 */
const minMaxRange = (values) => {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    const n = typeof v === 'number' && !Number.isNaN(v) ? v : 0;
    if (n < min) min = n;
    if (n > max) max = n;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 0 };
  }
  return { min, max };
};

/**
 * @param {number} value
 * @param {{ min: number, max: number }} range
 * @returns {number} 0..1
 */
const normalizeInRange = (value, range) => {
  if (!range || range.max === range.min) {
    // Barcha bir xil — signal yo'q deb emas, o'rtacha 0.5 (yoki 0 agar hammasi 0)
    const n = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
    if (range && range.max === 0 && range.min === 0) return 0;
    return n > 0 ? 0.5 : 0;
  }
  return normalize01(value, range.min, range.max);
};

/**
 * Single-movie trending from already-normalized component signals.
 *
 * @param {Object} parts
 * @param {number} parts.normViews
 * @param {number} parts.normAvgDuration
 * @param {number} parts.normLikes
 * @param {number} parts.completionRateAvg — 0..1
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [weights]
 * @returns {number}
 */
const combineTrendingParts = (parts, weights = scoringWeights) => {
  const t = weights.trending || {};
  const w1 = t.wViews ?? 0.35;
  const w2 = t.wAvgDuration ?? 0.25;
  const w3 = t.wLikes ?? 0.25;
  const w4 = t.wCompletion ?? 0.15;

  const score =
    w1 * clamp(parts.normViews ?? 0, 0, 1) +
    w2 * clamp(parts.normAvgDuration ?? 0, 0, 1) +
    w3 * clamp(parts.normLikes ?? 0, 0, 1) +
    w4 * clamp(parts.completionRateAvg ?? 0, 0, 1);

  return clamp(score, 0, 1);
};

/**
 * Score one raw aggregate row given category-level min/max ranges.
 *
 * @param {Object} raw
 * @param {number} [raw.viewCountRecent]
 * @param {number} [raw.avgWatchDuration]
 * @param {number} [raw.likeCount]
 * @param {number} [raw.completionRateAvg]
 * @param {Object} ranges
 * @param {{ min: number, max: number }} ranges.views
 * @param {{ min: number, max: number }} ranges.avgDuration
 * @param {{ min: number, max: number }} ranges.likes
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [weights]
 * @returns {number} 0..1
 */
const computeTrendingScore = (raw = {}, ranges = {}, weights = scoringWeights) => {
  const parts = {
    normViews: normalizeInRange(raw.viewCountRecent ?? 0, ranges.views || { min: 0, max: 0 }),
    normAvgDuration: normalizeInRange(
      raw.avgWatchDuration ?? 0,
      ranges.avgDuration || { min: 0, max: 0 }
    ),
    normLikes: normalizeInRange(raw.likeCount ?? 0, ranges.likes || { min: 0, max: 0 }),
    completionRateAvg: clamp(raw.completionRateAvg ?? 0, 0, 1),
  };
  return combineTrendingParts(parts, weights);
};

/**
 * Build min-max ranges for a category batch of raw aggregates.
 *
 * @param {Array<Object>} rows
 * @returns {{ views: {min:number,max:number}, avgDuration: {min:number,max:number}, likes: {min:number,max:number} }}
 */
const buildTrendingRanges = (rows = []) => ({
  views: minMaxRange(rows.map((r) => Number(r.viewCountRecent) || 0)),
  avgDuration: minMaxRange(rows.map((r) => Number(r.avgWatchDuration) || 0)),
  likes: minMaxRange(rows.map((r) => Number(r.likeCount) || 0)),
});

/**
 * Score an entire category batch (min-max within batch, then formula).
 *
 * @param {Array<{ movieId: string|number, viewCountRecent?: number, avgWatchDuration?: number, likeCount?: number, completionRateAvg?: number }>} rows
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [weights]
 * @returns {Array<Object>} rows + trendingScore
 */
const scoreTrendingBatch = (rows = [], weights = scoringWeights) => {
  if (!Array.isArray(rows) || !rows.length) return [];

  const ranges = buildTrendingRanges(rows);

  return rows.map((row) => ({
    movieId: row.movieId,
    category: row.category,
    viewCountRecent: Math.max(0, Number(row.viewCountRecent) || 0),
    avgWatchDuration: Math.max(0, Number(row.avgWatchDuration) || 0),
    likeCount: Math.max(0, Number(row.likeCount) || 0),
    completionRateAvg: clamp(row.completionRateAvg ?? 0, 0, 1),
    trendingScore: computeTrendingScore(row, ranges, weights),
    scoreSource: row.scoreSource === 'popularity' ? 'popularity' : 'trending',
  }));
};

/**
 * Empty-category / missing-DB fallback rows for the trending table.
 * Does NOT invent fake viewCountRecent / avgWatchDuration / completionRateAvg —
 * those stay 0; trendingScore is explicitly the popularity signal (0..1).
 *
 * @param {Array<Object>} movies
 * @param {string} category
 * @returns {Array<Object>}
 */
const buildPopularityFallbackScores = (movies = [], category = '') => {
  const cat = String(category || '').trim();
  if (!Array.isArray(movies) || !movies.length) return [];

  return movies.map((movie) => {
    const popularity = clamp(getPopularitySignal(movie), 0, 1);
    return {
      movieId: movie.id,
      category: cat || String(movie.categoryName || '').trim(),
      viewCountRecent: 0,
      avgWatchDuration: 0,
      likeCount: 0,
      completionRateAvg: 0,
      trendingScore: popularity,
      scoreSource: 'popularity',
    };
  });
};

/**
 * Resolve trending for blending.
 *
 * - Stored finite number (including 0) → use it (0 is NOT “missing”)
 * - Stored { score, source|scoreSource: 'popularity' } → keep popularity label
 * - Missing / null / NaN → live popularity fallback from movie, else zero
 *
 * @param {number|{ score: number, source?: string, scoreSource?: string }|null|undefined} stored
 * @param {Object} [movie] — for live popularity fallback
 * @param {import('../types/recommendation.types').ScoringWeightsConfig} [weights]
 * @returns {{ score: number, source: 'trending'|'popularity'|'zero' }}
 */
const resolveTrendingScore = (
  stored,
  movie = null,
  weights = scoringWeights
) => {
  let score = null;
  let labeledSource = null;

  if (stored != null && typeof stored === 'object' && !Array.isArray(stored)) {
    if (typeof stored.score === 'number' && !Number.isNaN(stored.score)) {
      score = stored.score;
      labeledSource = stored.source || stored.scoreSource || null;
    }
  } else if (typeof stored === 'number' && !Number.isNaN(stored)) {
    score = stored;
  }

  if (score != null) {
    const clamped = clamp(score, 0, 1);
    if (labeledSource === 'popularity') {
      return { score: clamped, source: 'popularity' };
    }
    return { score: clamped, source: 'trending' };
  }

  const useFallback = weights.trending?.usePopularityFallback !== false;
  if (useFallback && movie) {
    const pop = getPopularitySignal(movie);
    if (pop > 0) return { score: clamp(pop, 0, 1), source: 'popularity' };
  }

  return { score: 0, source: 'zero' };
};

module.exports = {
  minMaxRange,
  normalizeInRange,
  combineTrendingParts,
  computeTrendingScore,
  buildTrendingRanges,
  scoreTrendingBatch,
  buildPopularityFallbackScores,
  resolveTrendingScore,
};
