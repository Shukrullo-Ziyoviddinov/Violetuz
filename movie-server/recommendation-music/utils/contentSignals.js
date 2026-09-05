/**
 * Global music signals for scoring / cold-start.
 *
 * @module recommendation-music/utils/contentSignals
 */

'use strict';

const { clamp, normalize01 } = require('../../recommendation/utils/clamp');

/**
 * @param {import('../types/musicRecommendation.types').MusicContent} content
 * @returns {number} 0..1
 */
const getPopularitySignal = (content) => {
  if (!content || typeof content !== 'object') return 0;

  if (typeof content.popularityScore === 'number' && !Number.isNaN(content.popularityScore)) {
    return normalize01(content.popularityScore, 0, 100);
  }

  const likes = Number(content.like);
  if (!Number.isNaN(likes) && likes > 0) {
    return clamp(Math.log1p(likes) / Math.log1p(50_000), 0, 1);
  }

  return 0;
};

/**
 * @param {import('../types/musicRecommendation.types').MusicContent} content
 * @returns {number}
 */
const getRatingSignal = (content) => {
  if (!content || typeof content !== 'object') return 0;
  const rating = Number(content.rating);
  if (Number.isNaN(rating) || rating <= 0) return 0;
  const scale = rating <= 5.5 ? 5 : 10;
  return clamp(rating / scale, 0, 1);
};

/**
 * @param {import('../types/musicRecommendation.types').MusicContent} content
 * @param {Date|number} [now]
 * @returns {number}
 */
const getRecencySignal = (content, now = new Date()) => {
  if (!content || typeof content !== 'object') return 0;

  const year =
    typeof content.releaseYear === 'number'
      ? content.releaseYear
      : typeof content.year === 'number'
        ? content.year
        : null;

  if (year === null || year < 1900) return 0;

  const currentYear = now instanceof Date ? now.getFullYear() : new Date(now).getFullYear();
  const age = Math.max(0, currentYear - year);
  return clamp(1 - age / 20, 0, 1);
};

module.exports = {
  getPopularitySignal,
  getRatingSignal,
  getRecencySignal,
};
