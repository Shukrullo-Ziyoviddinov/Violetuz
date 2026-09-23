/**
 * Ballni 0..1 ga tushirish.
 * Shaxsiy va trend: har bir category ichida (bo'lim balllari bir-biriga qo'shilmaydi).
 * Yangi va exploration: manba ro'yxatining o'zida.
 *
 * @module home-feed/rank/normalize
 */

'use strict';

/**
 * @param {number[]} scores
 * @returns {number[]}
 */
const minMax = (scores) => {
  if (!scores.length) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const score of scores) {
    if (score < min) min = score;
    if (score > max) max = score;
  }
  const span = max - min;
  if (span <= 1e-9) {
    return scores.map((score) => (score > 0 ? 1 : 0));
  }
  return scores.map((score) => (score - min) / span);
};

/**
 * @param {Array<{ category?: string, rawScore?: number }>} rows
 * @param {{ perCategory?: boolean }} [opts]
 * @returns {Array<Object & { normalizedScore: number }>}
 */
const normalizeSourceRows = (rows, { perCategory = false } = {}) => {
  const list = Array.isArray(rows) ? rows : [];
  if (!perCategory) {
    const norms = minMax(list.map((row) => Number(row.rawScore) || 0));
    return list.map((row, index) => ({
      ...row,
      normalizedScore: norms[index],
    }));
  }

  /** @type {Map<string, Object[]>} */
  const groups = new Map();
  for (const row of list) {
    const category = String(row.category || '').trim();
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(row);
  }

  /** @type {Array<Object & { normalizedScore: number }>} */
  const out = [];
  for (const group of groups.values()) {
    const norms = minMax(group.map((row) => Number(row.rawScore) || 0));
    group.forEach((row, index) => {
      out.push({ ...row, normalizedScore: norms[index] });
    });
  }
  return out;
};

module.exports = {
  minMax,
  normalizeSourceRows,
};
