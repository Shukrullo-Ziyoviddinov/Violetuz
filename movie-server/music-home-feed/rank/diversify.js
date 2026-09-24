/**
 * Butun lenta diversity. Bo'lim-ichi musiqa diversity.service.js chaqirilmaydi.
 *
 * @module music-home-feed/rank/diversify
 */

'use strict';

const { musicHomeFeedWeights } = require('../config/musicHomeFeedWeights');

/**
 * @param {Object} item
 * @param {Object[]} selected
 * @param {Map<string, number>} categoryCount
 * @param {Map<string, number>} artistCount
 * @param {{ maxPerCategory: number, maxPerArtist: number, avoidAdjacentSameCategory: boolean, ignoredArtists?: Set<string> }} config
 * @param {boolean} checkAdjacent
 * @returns {boolean}
 */
const canTake = (item, selected, categoryCount, artistCount, config, checkAdjacent) => {
  const category = String(item.category || '').trim();
  if (!category) return false;
  if ((categoryCount.get(category) || 0) >= config.maxPerCategory) return false;

  for (const artist of item.artists || []) {
    if (config.ignoredArtists && config.ignoredArtists.has(artist)) continue;
    if ((artistCount.get(artist) || 0) >= config.maxPerArtist) return false;
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

const take = (item, selected, categoryCount, artistCount) => {
  selected.push(item);
  const category = item.category;
  categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
  for (const artist of item.artists || []) {
    artistCount.set(artist, (artistCount.get(artist) || 0) + 1);
  }
};

/**
 * @param {Object[]} ordered
 * @param {number} [limit]
 * @returns {Object[]}
 */
const diversifyFeed = (ordered, limit) => {
  const config = musicHomeFeedWeights.diversity || {};
  const maxPerCategory = Math.max(1, config.maxPerCategory ?? 5);
  const maxPerArtist = Math.max(1, config.maxPerArtist ?? 2);
  const size = Math.max(1, Number(limit) || musicHomeFeedWeights.feedSize || 40);
  const ignoreAbove = Number(config.ignoreArtistAboveShare);
  const ignoreShare = Number.isFinite(ignoreAbove) ? ignoreAbove : 0.5;
  const list = Array.isArray(ordered) ? ordered : [];
  const artistFreq = new Map();
  for (const item of list) {
    for (const artist of item.artists || []) {
      artistFreq.set(artist, (artistFreq.get(artist) || 0) + 1);
    }
  }
  const ignoredArtists = new Set();
  if (list.length > 0 && ignoreShare > 0) {
    for (const [artist, count] of artistFreq) {
      if (count / list.length > ignoreShare) ignoredArtists.add(artist);
    }
  }
  const rules = {
    maxPerCategory,
    maxPerArtist,
    avoidAdjacentSameCategory: config.avoidAdjacentSameCategory !== false,
    ignoredArtists,
  };

  /** @type {Object[]} */
  const selected = [];
  /** @type {Object[]} */
  const deferred = [];
  const categoryCount = new Map();
  const artistCount = new Map();

  for (const item of ordered || []) {
    if (canTake(item, selected, categoryCount, artistCount, rules, true)) {
      take(item, selected, categoryCount, artistCount);
    } else {
      deferred.push(item);
    }
    if (selected.length >= size) break;
  }

  for (const item of deferred) {
    if (selected.length >= size) break;
    if (canTake(item, selected, categoryCount, artistCount, rules, false)) {
      take(item, selected, categoryCount, artistCount);
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
