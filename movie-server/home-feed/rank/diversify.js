/**
 * Butun lenta diversity. Bo'lim-ichi diversity.service.js chaqirilmaydi.
 *
 * @module home-feed/rank/diversify
 */

'use strict';

const { homeFeedWeights } = require('../config/homeFeedWeights');

/**
 * @param {Object} item
 * @param {Object[]} selected
 * @param {Map<string, number>} categoryCount
 * @param {Map<string, number>} actorCount
 * @param {{ maxPerCategory: number, maxPerActor: number, avoidAdjacentSameCategory: boolean }} config
 * @param {boolean} checkAdjacent
 * @returns {boolean}
 */
const canTake = (item, selected, categoryCount, actorCount, config, checkAdjacent) => {
  const category = String(item.category || '').trim();
  if (!category) return false;
  if ((categoryCount.get(category) || 0) >= config.maxPerCategory) return false;

  for (const actor of item.actors || []) {
    if (config.ignoredActors && config.ignoredActors.has(actor)) continue;
    if ((actorCount.get(actor) || 0) >= config.maxPerActor) return false;
  }

  if (
    checkAdjacent &&
    config.avoidAdjacentSameCategory &&
    selected.length > 0 &&
    selected[selected.length - 1].category === category
  ) {
    return false;
  }

  return true;
};

const take = (item, selected, categoryCount, actorCount) => {
  selected.push(item);
  const category = item.category;
  categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
  for (const actor of item.actors || []) {
    actorCount.set(actor, (actorCount.get(actor) || 0) + 1);
  }
};

/**
 * @param {Object[]} ordered
 * @param {number} [limit]
 * @returns {Object[]}
 */
const diversifyFeed = (ordered, limit) => {
  const config = homeFeedWeights.diversity || {};
  const maxPerCategory = Math.max(1, config.maxPerCategory ?? 5);
  const maxPerActor = Math.max(1, config.maxPerActor ?? 2);
  const size = Math.max(1, Number(limit) || homeFeedWeights.feedSize || 40);
  const ignoreAbove = Number(config.ignoreActorAboveShare);
  const ignoreShare = Number.isFinite(ignoreAbove) ? ignoreAbove : 0.5;
  const list = Array.isArray(ordered) ? ordered : [];
  const actorFreq = new Map();
  for (const item of list) {
    for (const actor of item.actors || []) {
      actorFreq.set(actor, (actorFreq.get(actor) || 0) + 1);
    }
  }
  const ignoredActors = new Set();
  if (list.length > 0 && ignoreShare > 0) {
    for (const [actor, count] of actorFreq) {
      if (count / list.length > ignoreShare) ignoredActors.add(actor);
    }
  }
  const rules = {
    maxPerCategory,
    maxPerActor,
    avoidAdjacentSameCategory: config.avoidAdjacentSameCategory !== false,
    ignoredActors,
  };

  /** @type {Object[]} */
  const selected = [];
  /** @type {Object[]} */
  const deferred = [];
  const categoryCount = new Map();
  const actorCount = new Map();

  for (const item of ordered || []) {
    if (canTake(item, selected, categoryCount, actorCount, rules, true)) {
      take(item, selected, categoryCount, actorCount);
    } else {
      deferred.push(item);
    }
    if (selected.length >= size) break;
  }

  for (const item of deferred) {
    if (selected.length >= size) break;
    if (canTake(item, selected, categoryCount, actorCount, rules, false)) {
      take(item, selected, categoryCount, actorCount);
    }
  }

  if (rules.avoidAdjacentSameCategory) {
    for (let index = 1; index < selected.length; index += 1) {
      if (selected[index].category !== selected[index - 1].category) continue;
      let swapAt = -1;
      for (let next = index + 1; next < selected.length; next += 1) {
        if (selected[next].category !== selected[index - 1].category) {
          swapAt = next;
          break;
        }
      }
      if (swapAt > 0) {
        const current = selected[index];
        selected[index] = selected[swapAt];
        selected[swapAt] = current;
      }
    }
  }

  return selected.slice(0, size);
};

module.exports = {
  diversifyFeed,
};
