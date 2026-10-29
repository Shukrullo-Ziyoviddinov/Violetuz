'use strict';

const config = require('../config');
const { DAY_MS } = require('../utils/time');
const { emptyLongTerm, portionsOf, effectiveScore } = require('./contributions');

/**
 * @param {number} value
 * @returns {number}
 */
const normScore = (value) => {
  if (!value) return 0;
  const size = Math.abs(value);
  return Math.sign(value) * size / (size + config.affinityNormHalf);
};

/**
 * @param {object} catalog
 * @param {object} longTerm
 * @returns {number}
 */
const affinityOf = (catalog, longTerm) => {
  const portions = portionsOf(catalog);
  let total = 0;
  for (let i = 0; i < portions.length; i += 1) {
    const part = portions[i];
    const stored = (longTerm[part.bucket] && longTerm[part.bucket][part.key]) || 0;
    total += part.portion * normScore(stored);
  }
  return total;
};

/**
 * Newest session item has distance 0.
 * @param {object[]} items
 */
const sessionLongTerm = (items) => {
  const maps = emptyLongTerm();
  const list = items || [];
  for (let i = 0; i < list.length; i += 1) {
    const distance = list.length - 1 - i;
    const weight = config.positionDecay ** distance;
    const portions = portionsOf(list[i].refs || {});
    for (let p = 0; p < portions.length; p += 1) {
      const part = portions[p];
      const amount = part.portion * effectiveScore(list[i].score || 0, part.kind) * weight;
      maps[part.bucket][part.key] = (maps[part.bucket][part.key] || 0) + amount;
    }
  }
  return maps;
};

/**
 * @param {object} catalog
 * @param {Date} now
 * @returns {number}
 */
const freshnessBonus = (catalog, now) => {
  if (!catalog || !catalog.catalogAddedAt) return 0;
  const age = now.getTime() - new Date(catalog.catalogAddedAt).getTime();
  const windowMs = config.freshnessDays * DAY_MS;
  if (age < 0 || age > windowMs) return 0;
  return config.freshnessBonusMax * (1 - age / windowMs);
};

/**
 * @param {{ views?: number }|null|undefined} stats
 * @returns {number}
 */
const popularityBonus = (stats) => {
  const views = stats && stats.views > 0 ? stats.views : 0;
  if (!views) return 0;
  const raw = Math.log10(1 + views) / config.popularityLogDivisor;
  return Math.min(config.popularityBonusMax, raw);
};

/**
 * @param {object} catalog
 * @param {object} profile
 * @param {{ views?: number }|null} [stats]
 * @param {Date} [now]
 * @returns {number}
 */
const feedScoreOf = (catalog, profile, stats, now) => {
  const sessionMaps = sessionLongTerm(profile.session && profile.session.items);
  const sessionAffinity = affinityOf(catalog, sessionMaps);
  const longTermAffinity = affinityOf(catalog, profile.longTerm);
  return (
    config.sessionAffinityWeight * sessionAffinity +
    config.longTermAffinityWeight * longTermAffinity +
    freshnessBonus(catalog, now || new Date()) +
    popularityBonus(stats)
  );
};

module.exports = {
  affinityOf,
  freshnessBonus,
  popularityBonus,
  feedScoreOf,
};
