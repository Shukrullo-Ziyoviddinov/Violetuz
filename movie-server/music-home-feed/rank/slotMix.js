/**
 * Oddiy sort emas. Har 5 o'rin: 3 shaxsiy, 1 trend, 1 yangi yoki exploration.
 * Bo'sh guruh tashlab o'tiladi.
 * Juftlik manbasi shaxsiy o'ringa tushadi. Bo'sh bo'lsa o'rin qo'shilmaydi.
 *
 * @module music-home-feed/rank/slotMix
 */

'use strict';

const { musicHomeFeedWeights } = require('../config/musicHomeFeedWeights');

/**
 * 3, 1, 1 → personal, trending, freshOrExploration, personal, personal.
 *
 * @param {{ personal?: number, trending?: number, freshOrExploration?: number }} slotMix
 * @returns {string[]}
 */
const spreadPattern = (slotMix) => {
  const buckets = [
    { key: 'personal', left: Math.max(0, Number(slotMix.personal) || 0) },
    { key: 'trending', left: Math.max(0, Number(slotMix.trending) || 0) },
    {
      key: 'freshOrExploration',
      left: Math.max(0, Number(slotMix.freshOrExploration) || 0),
    },
  ];
  /** @type {string[]} */
  const pattern = [];
  const total = buckets.reduce((sum, bucket) => sum + bucket.left, 0);
  let guard = total;
  while (guard > 0 && buckets.some((bucket) => bucket.left > 0)) {
    guard -= 1;
    for (const bucket of buckets) {
      if (bucket.left <= 0) continue;
      pattern.push(bucket.key);
      bucket.left -= 1;
    }
  }
  return pattern;
};

const slotKeyFor = (sourceType) => {
  if (sourceType === 'personal' || sourceType === 'collaborative') return 'personal';
  if (sourceType === 'trending') return 'trending';
  if (sourceType === 'fresh' || sourceType === 'exploration') return 'freshOrExploration';
  return null;
};

const byScore = (a, b) =>
  b.finalScore - a.finalScore || String(a.contentId).localeCompare(String(b.contentId));

/**
 * @param {Object[]} candidates
 * @returns {Object[]}
 */
const mixSlots = (candidates) => {
  const pattern = spreadPattern(musicHomeFeedWeights.slotMix || {});
  /** @type {Record<string, Object[]>} */
  const queues = {
    personal: [],
    trending: [],
    freshOrExploration: [],
  };

  for (const row of candidates || []) {
    const key = slotKeyFor(row.sourceType);
    if (!key) continue;
    queues[key].push(row);
  }
  for (const key of Object.keys(queues)) {
    queues[key].sort(byScore);
  }

  /** @type {Object[]} */
  const mixed = [];
  const used = new Set();
  const cursors = { personal: 0, trending: 0, freshOrExploration: 0 };

  const pull = (key) => {
    const queue = queues[key];
    while (cursors[key] < queue.length) {
      const row = queue[cursors[key]];
      cursors[key] += 1;
      if (used.has(row.contentId)) continue;
      used.add(row.contentId);
      return row;
    }
    return null;
  };

  const remaining = () =>
    Object.keys(queues).some((key) => cursors[key] < queues[key].length);

  while (remaining()) {
    let placed = false;
    const cycle = pattern.length ? pattern : ['personal', 'trending', 'freshOrExploration'];
    for (const key of cycle) {
      const row = pull(key);
      if (!row) continue;
      mixed.push(row);
      placed = true;
    }
    if (!placed) break;
  }

  return mixed;
};

module.exports = {
  spreadPattern,
  mixSlots,
};
