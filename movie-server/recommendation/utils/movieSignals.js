/**
 * Global movie signals for scoring / cold-start (popularity, rating, recency).
 * Normalized to ~[0, 1] so weights in scoringWeights stay comparable.
 *
 * @module recommendation/utils/movieSignals
 */

'use strict';

const { clamp, normalize01 } = require('./clamp');

/**
 * @param {import('../types/recommendation.types').Movie} movie
 * @returns {number} 0..1
 */
const getPopularitySignal = (movie) => {
  if (!movie || typeof movie !== 'object') return 0;

  if (typeof movie.popularityScore === 'number' && !Number.isNaN(movie.popularityScore)) {
    return normalize01(movie.popularityScore, 0, 100);
  }

  const likes = Number(movie.like);
  if (!Number.isNaN(likes) && likes > 0) {
    // Soft log scale — avoids a single viral title crushing the list
    return clamp(Math.log1p(likes) / Math.log1p(50_000), 0, 1);
  }

  return 0;
};

/**
 * Average of available ratings, scaled to 0..1.
 * @param {import('../types/recommendation.types').Movie} movie
 * @returns {number}
 */
const getRatingSignal = (movie) => {
  if (!movie || typeof movie !== 'object') return 0;

  const candidates = [movie.rating, movie.ratingImdb, movie.ratingKinopoisk].filter(
    (n) => typeof n === 'number' && !Number.isNaN(n) && n > 0
  );
  if (!candidates.length) return 0;

  const avg = candidates.reduce((sum, n) => sum + n, 0) / candidates.length;
  const scale = avg <= 5.5 ? 5 : 10;
  return clamp(avg / scale, 0, 1);
};

/**
 * Newer releases get a mild bonus; missing year → 0.
 * @param {import('../types/recommendation.types').Movie} movie
 * @param {Date|number} [now]
 * @returns {number} 0..1
 */
const getRecencySignal = (movie, now = new Date()) => {
  if (!movie || typeof movie !== 'object') return 0;

  const year =
    typeof movie.releaseYear === 'number'
      ? movie.releaseYear
      : typeof movie.specs?.year === 'number'
        ? movie.specs.year
        : null;

  if (year === null || year < 1888) return 0;

  const currentYear = now instanceof Date ? now.getFullYear() : new Date(now).getFullYear();
  const age = Math.max(0, currentYear - year);
  // Full bonus at current year; fades to 0 over ~20 years
  return clamp(1 - age / 20, 0, 1);
};

module.exports = {
  getPopularitySignal,
  getRatingSignal,
  getRecencySignal,
};
