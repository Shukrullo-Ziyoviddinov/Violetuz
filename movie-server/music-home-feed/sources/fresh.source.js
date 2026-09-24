/**
 * Yangi qo'shiq. Katalogdagi yil. createdAt va sayt rating yo'q.
 * Shaxsiy, trend va exploration chaqirilmaydi.
 *
 * @module music-home-feed/sources/fresh.source
 */

'use strict';

const { musicHomeFeedWeights } = require('../config/musicHomeFeedWeights');
const { findCatalogTracks } = require('../repositories/catalog.read');

/**
 * @param {unknown} year
 * @param {number} nowYear
 * @param {number} maxAgeYears
 * @returns {number} 1 = shu yil, 0 = oyna cheti
 */
const yearScore = (year, nowYear, maxAgeYears) => {
  const value = Number(year);
  if (!Number.isInteger(value)) return 0;
  const span = Math.max(0, maxAgeYears);
  const age = nowYear - value;
  if (age < 0 || age > span) return 0;
  if (span === 0) return 1;
  return 1 - age / (span + 1);
};

/**
 * @param {number} [nowMs]
 * @returns {Promise<Array<{ contentId: string, category: string, sourceType: 'fresh', rawScore: number }>>}
 */
const listFreshSource = async (nowMs = Date.now()) => {
  const cfg = musicHomeFeedWeights.fresh || {};
  const maxAgeYears = Math.max(0, Number(cfg.maxAgeYears) || 0);
  const limit = musicHomeFeedWeights.candidateLimits.fresh;
  const nowYear = new Date(nowMs).getUTCFullYear();
  const minYear = nowYear - maxAgeYears;

  const rows = await findCatalogTracks(
    { year: { $gte: minYear, $lte: nowYear } },
    Math.max(limit * 4, limit),
    { year: -1, id: -1 }
  );

  const ranked = [];
  for (const row of rows) {
    const contentId = String(row.id ?? '').trim();
    const category = String(row.categoryNameMusic || '').trim();
    if (!contentId || !category) continue;
    const rawScore = yearScore(row.year, nowYear, maxAgeYears);
    if (rawScore <= 0) continue;
    ranked.push({
      contentId,
      category,
      sourceType: 'fresh',
      rawScore,
    });
  }

  ranked.sort((a, b) => b.rawScore - a.rawScore || a.contentId.localeCompare(b.contentId));
  return ranked.slice(0, Math.max(1, limit));
};

module.exports = {
  listFreshSource,
  yearScore,
};
