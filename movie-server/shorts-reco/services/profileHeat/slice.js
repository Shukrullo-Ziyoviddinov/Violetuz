'use strict';

const { genreProfileKey, musicGenreProfileKey } = require('../../utils/keys');
const { seenStatus, canRepeat } = require('../eligibility.service');
const { activityScore, dayWeight } = require('./heat');

/**
 * Extra share for other shorts of active profiles.
 * The cap stays small. A slowed user loses share only on the profiles they passed.
 * Blocked watches stay out. Repeats enter only when the existing repeat rule allows them.
 */

const SHARE = Object.freeze({
  cap: 2,
  perProfile: 1,
  softenAt: 1,
  pauseAt: 3,
});

const ARTIST_SHORT_LIMIT = 100;

/**
 * @param {unknown} days
 * @param {Date} now
 * @returns {number}
 */
const slowdownScore = (days, now) => {
  if (!Array.isArray(days)) return 0;
  let total = 0;
  for (let i = 0; i < days.length; i += 1) {
    const row = days[i];
    if (!row || !Number.isSafeInteger(row.passes) || row.passes <= 0) continue;
    total += row.passes * dayWeight(row.day, now);
  }
  return total;
};

/**
 * @param {unknown} store
 * @param {string} key
 * @returns {unknown}
 */
const readKey = (store, key) => {
  if (!store) return null;
  if (typeof store.get === 'function') return store.get(key);
  return store[key];
};

/**
 * @param {unknown} exclude
 * @returns {Set<string>}
 */
const excludedIds = (exclude) => {
  const set = new Set();
  const list = exclude instanceof Set ? Array.from(exclude) : exclude;
  if (!Array.isArray(list)) return set;
  for (let i = 0; i < list.length; i += 1) {
    if (typeof list[i] === 'string' && list[i]) set.add(list[i]);
  }
  return set;
};

/**
 * @param {object} short
 * @param {Record<string, number>|null|undefined} genreScores
 * @returns {number}
 */
const genreStrength = (short, genreScores) => {
  const scores = genreScores || {};
  let total = 0;
  const movieGenres = Array.isArray(short.movieGenres) ? short.movieGenres : [];
  const musicGenres = Array.isArray(short.musicGenres) ? short.musicGenres : [];
  for (let i = 0; i < movieGenres.length; i += 1) {
    const key = genreProfileKey(movieGenres[i]);
    const score = key ? scores[key] : 0;
    if (score > 0) total += score;
  }
  for (let i = 0; i < musicGenres.length; i += 1) {
    const key = musicGenreProfileKey(musicGenres[i]);
    const score = key ? scores[key] : 0;
    if (score > 0) total += score;
  }
  return total;
};

/**
 * @param {object} left
 * @param {object} right
 * @param {Map<string, object>} watches
 * @returns {number}
 */
const compareShorts = (left, right, watches) => {
  if (left.status !== right.status) return left.status === 'unseen' ? -1 : 1;
  if (left.strength !== right.strength) return right.strength - left.strength;
  if (left.status === 'repeat') {
    const a = watches.get(left.short.shortId) || {};
    const b = watches.get(right.short.shortId) || {};
    const aEngaged = Boolean(a.liked || a.commented);
    const bEngaged = Boolean(b.liked || b.commented);
    if (aEngaged !== bEngaged) return aEngaged ? 1 : -1;
    const aSeen = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
    const bSeen = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
    if (aSeen !== bSeen) return aSeen - bSeen;
  }
  if (left.short.shortId < right.short.shortId) return -1;
  if (left.short.shortId > right.short.shortId) return 1;
  return 0;
};

/**
 * @param {object[]} profiles
 * @param {{
 *   shortsByKey?: Map<string, object[]>|Record<string, object[]>,
 *   watches?: Map<string, object>|Record<string, object>,
 *   genreScores?: Record<string, number>,
 *   slowdownByKey?: Map<string, object>|Record<string, object>,
 *   exclude?: string[]|Set<string>,
 *   now: Date,
 *   repeat?: { anchorIsTop2?: boolean, unseenRemaining?: boolean, repeatsUsed?: number },
 * }} input
 * @returns {object[]}
 */
const selectProfileSlice = (profiles, input) => {
  const source = input || {};
  const now = source.now;
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) return [];
  const repeatsOpen = canRepeat(source.repeat);
  const taken = excludedIds(source.exclude);
  const watches = new Map();
  const rows = [];

  for (let i = 0; i < (profiles || []).length; i += 1) {
    const profile = profiles[i];
    if (!profile || profile.kind !== 'artist') continue;
    const activity = activityScore(profile.days, now);
    if (activity <= 0) continue;
    const slowdown = readKey(source.slowdownByKey, profile.key);
    const slow = slowdownScore(slowdown && slowdown.days, now);
    if (slow >= SHARE.pauseAt) continue;

    const shorts = readKey(source.shortsByKey, profile.key) || [];
    const eligible = [];
    const seenShorts = new Set();
    for (let j = 0; j < shorts.length && eligible.length < shorts.length; j += 1) {
      const short = shorts[j];
      if (!short || short.artistId !== profile.id || typeof short.shortId !== 'string') continue;
      if (taken.has(short.shortId) || seenShorts.has(short.shortId)) continue;
      const watch = readKey(source.watches, short.shortId);
      const status = seenStatus(watch, now);
      if (status === 'blocked') continue;
      if (status === 'repeat' && !repeatsOpen) continue;
      seenShorts.add(short.shortId);
      watches.set(short.shortId, watch || {});
      eligible.push({
        short,
        status,
        strength: genreStrength(short, source.genreScores),
      });
    }
    if (eligible.length === 0) continue;
    eligible.sort((left, right) => compareShorts(left, right, watches));
    const picked = eligible.slice(0, SHARE.perProfile);
    for (let j = 0; j < picked.length; j += 1) {
      rows.push({
        short: picked[j].short,
        activity,
        strength: picked[j].strength,
        soft: slow >= SHARE.softenAt,
      });
      taken.add(picked[j].short.shortId);
    }
  }

  rows.sort((left, right) => {
    if (left.soft !== right.soft) return left.soft ? 1 : -1;
    const leftMatch = left.strength > 0 ? 0 : 1;
    const rightMatch = right.strength > 0 ? 0 : 1;
    if (leftMatch !== rightMatch) return leftMatch - rightMatch;
    if (left.activity !== right.activity) return right.activity - left.activity;
    if (left.short.shortId < right.short.shortId) return -1;
    if (left.short.shortId > right.short.shortId) return 1;
    return 0;
  });

  return rows.slice(0, SHARE.cap).map((row) => row.short);
};

/**
 * @param {{
 *   heatRepo: object,
 *   catalogRepo: object,
 *   now?: () => Date,
 * }} options
 */
const createProfileSliceService = (options) => {
  if (!options || !options.heatRepo || !options.catalogRepo) {
    throw new Error('profile slice requires heat and catalog stores');
  }
  const now = options.now || (() => new Date());

  return {
    /**
     * @param {{
     *   userId?: string|null,
     *   genreScores?: Record<string, number>,
     *   watches?: Map<string, object>|Record<string, object>,
     *   exclude?: string[]|Set<string>,
     *   repeat?: object,
     * }} input
     * @returns {Promise<object[]>}
     */
    async selectForUser(input) {
      const source = input || {};
      const at = now();
      const profiles = await options.heatRepo.listHeat();
      const active = [];
      const shortsByKey = new Map();
      const slowdownByKey = new Map();

      for (let i = 0; i < profiles.length; i += 1) {
        const profile = profiles[i];
        if (!profile || profile.kind !== 'artist') continue;
        if (activityScore(profile.days, at) <= 0) continue;
        active.push(profile);
        shortsByKey.set(
          profile.key,
          await options.catalogRepo.findByArtistId(profile.id, ARTIST_SHORT_LIMIT)
        );
        if (source.userId) {
          const slowdown = await options.heatRepo.findUserSlowdown(source.userId, profile.key);
          if (slowdown) slowdownByKey.set(profile.key, slowdown);
        }
      }

      return selectProfileSlice(active, {
        shortsByKey,
        slowdownByKey,
        watches: source.watches,
        genreScores: source.genreScores,
        exclude: source.exclude,
        repeat: source.repeat,
        now: at,
      });
    },
  };
};

module.exports = {
  SHARE,
  slowdownScore,
  selectProfileSlice,
  createProfileSliceService,
};
