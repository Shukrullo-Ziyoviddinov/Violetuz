/**
 * Yangi kino manbasi. Faqat katalog createdAt + rating.
 * Shaxsiy, trend va exploration chaqirilmaydi.
 *
 * @module home-feed/sources/fresh.source
 */

'use strict';

const { homeFeedWeights } = require('../config/homeFeedWeights');
const { findCatalogMovies } = require('./catalog.read');

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param {unknown} rating
 * @returns {boolean}
 */
const isUnrated = (rating) => {
  if (rating == null || rating === '') return true;
  const value = Number(rating);
  return !Number.isFinite(value) || value <= 0;
};

/**
 * @param {Date|string|number|null} createdAt
 * @param {number} nowMs
 * @param {number} maxAgeDays
 * @returns {number} 1 = hozir qo'shilgan, 0 = oyna cheti
 */
const ageScore = (createdAt, nowMs, maxAgeDays) => {
  const createdMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdMs)) return 0;
  const ageDays = Math.max(0, (nowMs - createdMs) / DAY_MS);
  const windowDays = Math.max(1, maxAgeDays);
  return Math.max(0, 1 - ageDays / windowDays);
};

/**
 * @param {number} [nowMs]
 * @returns {Promise<Array<{ movieId: string, category: string, sourceType: 'fresh', rawScore: number, unrated: boolean }>>}
 */
const listFreshSource = async (nowMs = Date.now()) => {
  const cfg = homeFeedWeights.fresh || {};
  const maxAgeDays = cfg.maxAgeDays ?? 45;
  const minRating = cfg.minRating ?? 4.7;
  const allowUnrated = cfg.allowUnrated !== false;
  const limit = homeFeedWeights.candidateLimits.fresh;
  const since = new Date(nowMs - maxAgeDays * DAY_MS);

  const ratingClause = [{ rating: { $gte: minRating } }];
  if (allowUnrated) {
    ratingClause.push({ rating: { $in: [null, 0] } });
  }

  const rows = await findCatalogMovies(
    {
      createdAt: { $gte: since },
      $or: ratingClause,
    },
    Math.max(limit * 4, limit),
    { createdAt: -1, rating: -1 }
  );

  const ranked = [];
  for (const row of rows) {
    const movieId = String(row.id ?? '').trim();
    const category = String(row.categoryName || '').trim();
    if (!movieId || !category) continue;
    const unrated = isUnrated(row.rating);
    const quality = unrated ? 0.35 : Math.min(1, (Number(row.rating) || 0) / 5);
    ranked.push({
      movieId,
      category,
      sourceType: 'fresh',
      unrated,
      rawScore: 0.6 * ageScore(row.createdAt, nowMs, maxAgeDays) + 0.4 * quality,
    });
  }

  ranked.sort((a, b) => b.rawScore - a.rawScore || a.movieId.localeCompare(b.movieId));
  return ranked.slice(0, Math.max(1, limit));
};

module.exports = {
  listFreshSource,
};
