'use strict';
const { createHash } = require('node:crypto');

const createTieBreaker = (seed) => {
  const cache = new Map();
  return (scope, value) => {
    const identity = JSON.stringify([scope, value]);
    if (!cache.has(identity)) cache.set(identity, createHash('sha256').update(`${seed}:${identity}`).digest('hex'));
    return cache.get(identity);
  };
};

/** Select whole-channel rounds BEFORE truncation. Null ownership is ONE bucket. */
const selectAcrossChannels = (rows, { limit, cap = Infinity, relax = false, compareChannels }) => {
  const buckets = new Map();
  for (const row of rows) {
    const channel = row.channelId == null || row.channelId === '' ? null : String(row.channelId);
    if (!buckets.has(channel)) buckets.set(channel, []);
    buckets.get(channel).push(row);
  }
  const groups = [...buckets].map(([channel, items]) => ({ channel, items, index: 0 }));
  groups.sort(compareChannels);
  const selected = [];
  const pass = (maximum) => {
    let advanced = true;
    while (selected.length < limit && advanced) {
      advanced = false;
      for (const group of groups) {
        if (selected.length >= limit) break;
        if (group.index >= group.items.length || group.index >= maximum) continue;
        selected.push(group.items[group.index++]);
        advanced = true;
      }
    }
  };
  pass(cap);
  const relaxed = relax && selected.length < Math.min(limit, rows.length);
  if (relaxed) pass(Infinity);
  return { rows: selected, relaxed, channelCount: new Set(selected.map((row) => row.channelId || null)).size };
};

module.exports = { createTieBreaker, selectAcrossChannels };
