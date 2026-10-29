'use strict';

const config = require('../config');
const collections = require('../config/collections');
const { movieProfileKey, musicProfileKey, artistProfileKey } = require('../utils/keys');

const movieShortType = collections.existing.shortsVideos.type;
const musicShortType = collections.existing.musicShorts.type;

/**
 * @param {object|null|undefined} map
 */
const cloneMap = (map) => ({ ...(map || {}) });

/**
 * @param {object|null|undefined} item
 * @returns {number}
 */
const itemTime = (item) => {
  if (!item || !item.ts) return 0;
  const time = new Date(item.ts).getTime();
  return Number.isFinite(time) ? time : 0;
};

/**
 * Positive session rows only. Movie shorts do not take a music short's linked movie.
 * @param {object} item
 * @returns {object[]}
 */
const anchorParts = (item) => {
  if (!item || !(item.score > 0) || !item.refs) return [];
  const refs = item.refs;
  const out = [];
  const push = (key, kind, amount, extra) => {
    if (!key || !amount) return;
    out.push({ key, kind, amount, ...extra });
  };

  if (refs.type === movieShortType) {
    const share = config.shares.movieShorts;
    push(movieProfileKey(refs.movieId), 'movie', share.movie * item.score, { movieId: refs.movieId });
    push(musicProfileKey(refs.musicKey), 'music', share.musicKey * item.score, { musicKey: refs.musicKey });
    push(artistProfileKey(refs.artistId), 'artist', share.artist * item.score, { artistId: refs.artistId });
    return out;
  }

  if (refs.type === musicShortType) {
    const share = config.shares.musicshorts;
    push(artistProfileKey(refs.artistId), 'artist', share.artist * item.score, { artistId: refs.artistId });
    push(musicProfileKey(refs.musicKey), 'music', share.musicKey * item.score, { musicKey: refs.musicKey });
  }
  return out;
};

/**
 * @param {object[]} items
 * @returns {Map<string, object>}
 */
const rawStrengths = (items) => {
  const map = new Map();
  const list = items || [];
  for (let i = 0; i < list.length; i += 1) {
    const weight = config.positionDecay ** (list.length - 1 - i);
    const parts = anchorParts(list[i]);
    for (let p = 0; p < parts.length; p += 1) {
      const part = parts[p];
      const current = map.get(part.key) || {
        key: part.key,
        kind: part.kind,
        raw: 0,
        movieId: null,
        musicKey: null,
        artistId: null,
      };
      current.raw += part.amount * weight;
      if (part.movieId != null) current.movieId = part.movieId;
      if (part.musicKey) current.musicKey = part.musicKey;
      if (part.artistId) current.artistId = part.artistId;
      map.set(part.key, current);
    }
  }
  return map;
};

/**
 * @param {Map<string, object>} rawMap
 * @param {Record<string, number>} multipliers
 */
const rankActive = (rawMap, multipliers) => {
  const rows = [];
  rawMap.forEach((row) => {
    const multiplier = multipliers[row.key] == null ? 1 : multipliers[row.key];
    const strength = row.raw * multiplier;
    if (strength >= config.anchorMinStrength) {
      rows.push({ ...row, multiplier, strength });
    }
  });
  rows.sort((left, right) => {
    if (right.strength !== left.strength) return right.strength - left.strength;
    return left.key < right.key ? -1 : 1;
  });
  return rows.slice(0, config.maxActiveAnchors);
};

/**
 * Recency-weighted positive scores. A tie follows the latest strong short.
 * @param {object[]} items
 * @returns {'movie'|'music'}
 */
const dominantFamily = (items) => {
  const list = items || [];
  let movie = 0;
  let music = 0;
  let lastStrong = null;
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    if (!item || !(item.score > 0)) continue;
    const amount = item.score * (config.positionDecay ** (list.length - 1 - i));
    const isMusic = item.refs && item.refs.type === musicShortType;
    if (isMusic) music += amount;
    else movie += amount;
    if (item.score >= config.shiftMinScore) lastStrong = isMusic ? 'music' : 'movie';
  }
  if (music > movie) return 'music';
  if (movie > music) return 'movie';
  return lastStrong || 'movie';
};

/**
 * A key shared by every item in the window. The strongest shared key wins.
 * @param {object[]} items
 * @param {Map<string, object>} rawMap
 */
const sharedKey = (items, rawMap) => {
  if (!items.length) return null;
  const sets = items.map((item) => new Set(anchorParts(item).map((part) => part.key)));
  let best = null;
  sets[0].forEach((key) => {
    if (!sets.every((set) => set.has(key))) return;
    const raw = rawMap.has(key) ? rawMap.get(key).raw : 0;
    if (!best || raw > best.raw) best = { key, raw };
  });
  return best ? best.key : null;
};

/**
 * Reset only when a later positive short engages the key after the halve.
 * @param {object[]} items
 * @param {Record<string, number>} multipliers
 * @param {Record<string, string>} locks
 * @param {Record<string, boolean>} fatigue
 */
const resetEngaged = (items, multipliers, locks, fatigue) => {
  if (!items.length) return;
  const latest = items[items.length - 1];
  if (!latest || !(latest.score >= config.shiftMinScore)) return;
  const latestTs = itemTime(latest);
  const parts = anchorParts(latest);
  for (let i = 0; i < parts.length; i += 1) {
    const key = parts[i].key;
    const lock = locks[key] ? new Date(locks[key]).getTime() : 0;
    if (lock && latestTs <= lock) continue;
    if (multipliers[key] != null) multipliers[key] = 1;
    delete locks[key];
    delete fatigue[key];
  }
};

/**
 * @param {object[]} items
 * @param {Map<string, object>} rawMap
 * @param {Record<string, number>} multipliers
 * @param {Record<string, string>} locks
 * @param {string|null} pinned
 * @returns {string|null}
 */
const applyShift = (items, rawMap, multipliers, locks, pinned) => {
  const count = config.shiftItemCount;
  if (!items || items.length < count) return null;
  const tail = items.slice(-count);
  if (!tail.every((item) => item && item.score >= config.shiftMinScore)) return null;
  const key = sharedKey(tail, rawMap);
  if (!key) return null;
  const active = rankActive(rawMap, multipliers);
  if (active.some((row) => row.key === key) || pinned === key) return null;

  const shiftTs = tail[tail.length - 1].ts || null;
  for (let i = 0; i < active.length; i += 1) {
    const anchorKey = active[i].key;
    const current = multipliers[anchorKey] == null ? 1 : multipliers[anchorKey];
    multipliers[anchorKey] = current * config.anchorHalveFactor;
    if (shiftTs) locks[anchorKey] = shiftTs;
  }
  multipliers[key] = 1;
  delete locks[key];
  return key;
};

/**
 * One halve per tired anchor until a later positive short clears the flag.
 * @param {Record<string, number>} multipliers
 * @param {Record<string, boolean>} fatigue
 * @param {Record<string, string>} locks
 * @param {object[]} served
 * @param {Date} now
 */
const applyFatigue = (multipliers, fatigue, locks, served, now) => {
  const recent = (served || []).slice(-config.fatigueServedCount);
  /** @type {Map<string, number[]>} */
  const groups = new Map();
  for (let i = 0; i < recent.length; i += 1) {
    const row = recent[i];
    if (!row || !row.anchorKey || row.bestPassRatio == null) continue;
    const ratios = groups.get(row.anchorKey) || [];
    ratios.push(row.bestPassRatio);
    groups.set(row.anchorKey, ratios);
  }
  const stamp = (now || new Date()).toISOString();
  groups.forEach((ratios, key) => {
    if (ratios.length < config.fatigueSameAnchorCount || fatigue[key]) return;
    const mean = ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
    if (mean >= config.fatigueMeanPassRatio) return;
    const current = multipliers[key] == null ? 1 : multipliers[key];
    multipliers[key] = current * config.anchorHalveFactor;
    fatigue[key] = true;
    locks[key] = stamp;
  });
};

/**
 * @param {Map<string, object>} raw
 * @param {Record<string, number>} multipliers
 * @param {string|null} pinned
 */
const withPinned = (raw, multipliers, pinned) => {
  const active = rankActive(raw, multipliers);
  if (!pinned || !raw.has(pinned)) return active;
  const row = raw.get(pinned);
  const multiplier = multipliers[pinned] == null ? 1 : multipliers[pinned];
  const forced = { ...row, multiplier, strength: row.raw * multiplier };
  return [forced, ...active.filter((item) => item.key !== pinned)].slice(0, config.maxActiveAnchors);
};

/**
 * Anchor state is persisted so the next feed call does not halve again.
 * @param {{
 *   items?: object[],
 *   multipliers?: Record<string, number>,
 *   locks?: Record<string, string>,
 *   fatigue?: Record<string, boolean>,
 *   pinned?: string|null,
 *   served?: object[],
 *   now?: Date,
 * }} input
 */
const planAnchors = (input) => {
  const source = input || {};
  const list = source.items || [];
  const multipliers = cloneMap(source.multipliers);
  const locks = cloneMap(source.locks);
  const fatigue = cloneMap(source.fatigue);
  let pinned = source.pinned || null;

  resetEngaged(list, multipliers, locks, fatigue);
  const raw = rawStrengths(list);
  const promoted = applyShift(list, raw, multipliers, locks, pinned);
  if (promoted) pinned = promoted;
  if (pinned && !raw.has(pinned)) pinned = null;
  applyFatigue(multipliers, fatigue, locks, source.served, source.now);

  const active = withPinned(raw, multipliers, pinned);
  return {
    active,
    dominant: dominantFamily(list),
    levelStrength: active.reduce((max, row) => Math.max(max, row.strength), 0),
    multipliers,
    locks,
    fatigue,
    pinned,
  };
};

module.exports = {
  anchorParts,
  dominantFamily,
  planAnchors,
};
