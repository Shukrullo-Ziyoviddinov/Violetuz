'use strict';

const config = require('../../config');

/**
 * @param {number} strength
 */
const levelFor = (strength) => {
  const value = strength || 0;
  let chosen = config.levels[0];
  for (let i = 0; i < config.levels.length; i += 1) {
    if (value >= config.levels[i].minStrength) chosen = config.levels[i];
  }
  return chosen;
};

/**
 * @param {number} rest
 * @returns {number}
 */
const exploreCountFor = (rest) =>
  Math.min(rest, Math.max(1, Math.round(config.slotsPerCycle * config.exploreShare)));

/**
 * @param {string} source
 * @param {number} count
 * @param {object} [extra]
 */
const repeatSlot = (source, count, extra) => {
  const slots = [];
  for (let i = 0; i < count; i += 1) slots.push({ source, ...(extra || {}) });
  return slots;
};

/**
 * @param {object[]} left
 * @param {object[]} right
 */
const interleave = (left, right) => {
  const out = [];
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i += 1) {
    if (i < left.length) out.push(left[i]);
    if (i < right.length) out.push(right[i]);
  }
  return out;
};

/**
 * One cycle of 10. Actor slots are removed from similar.
 * @param {{ level: object|string, dominant?: string, actorSlots?: number }} input
 */
const buildCycle = (input) => {
  const source = input || {};
  const spec = typeof source.level === 'string'
    ? config.levels.find((row) => row.name === source.level) || config.levels[0]
    : source.level;
  const [primary, secondary, tertiary] = spec.anchor;
  const anchors = source.dominant === 'music'
    ? [
      ...repeatSlot('sameArtist', primary, { mode: 'artist' }),
      ...repeatSlot('sameMusic', secondary),
      ...repeatSlot('sameArtist', tertiary, { mode: 'klipKonsert' }),
    ]
    : [
      ...repeatSlot('sameMovie', primary),
      ...repeatSlot('sameMusic', secondary),
      ...repeatSlot('sameArtist', tertiary, { mode: 'fromMovie' }),
    ];
  const actorCount = Math.min(source.actorSlots || 0, spec.similar);
  const exploreCount = exploreCountFor(spec.rest);
  const rest = [
    ...repeatSlot('actor', actorCount),
    ...repeatSlot('similar', spec.similar - actorCount),
    ...repeatSlot('bridge', spec.bridge),
    ...repeatSlot('profile', spec.rest - exploreCount),
    ...repeatSlot('explore', exploreCount),
  ];
  return interleave(anchors, rest);
};

/**
 * @param {{ strength?: number, dominant?: string, actorSlots?: number, cycles?: number }} input
 */
const buildSlotPlan = (input) => {
  const source = input || {};
  const level = levelFor(source.strength);
  const cycles = source.cycles == null
    ? Math.ceil(config.feedBatchSize / config.slotsPerCycle)
    : source.cycles;
  const slots = [];
  for (let i = 0; i < cycles; i += 1) {
    slots.push(...buildCycle({
      level,
      dominant: source.dominant,
      actorSlots: source.actorSlots,
    }));
  }
  return { level: level.name, slots };
};

module.exports = {
  levelFor,
  exploreCountFor,
  buildCycle,
  buildSlotPlan,
};
