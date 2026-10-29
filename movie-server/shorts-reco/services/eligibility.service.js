'use strict';

const config = require('../config');
const { DAY_MS } = require('../utils/time');

/**
 * The 7-day window restarts from the latest view.
 * @param {object|null|undefined} watch
 * @param {Date} now
 * @returns {'unseen'|'blocked'|'repeat'}
 */
const seenStatus = (watch, now) => {
  if (!watch || !watch.lastSeenAt) return 'unseen';
  const seen = new Date(watch.lastSeenAt).getTime();
  if (!Number.isFinite(seen)) return 'unseen';
  const ageDays = ((now || new Date()).getTime() - seen) / DAY_MS;
  if (ageDays < config.repeatAfterDays) return 'blocked';
  return 'repeat';
};

/**
 * No like and no comment first, then the oldest lastSeenAt.
 * @param {object[]} docs
 * @param {Map<string, object>} watches
 * @returns {object[]}
 */
const orderRepeats = (docs, watches) =>
  (docs || []).slice().sort((left, right) => {
    const a = watches.get(left.shortId) || {};
    const b = watches.get(right.shortId) || {};
    const aEngaged = Boolean(a.liked || a.commented);
    const bEngaged = Boolean(b.liked || b.commented);
    if (aEngaged !== bEngaged) return aEngaged ? 1 : -1;
    const aSeen = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
    const bSeen = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
    return aSeen - bSeen;
  });

/**
 * Repeats are optional. A slot stays empty when these are not all true.
 * @param {{ anchorIsTop2?: boolean, unseenRemaining?: boolean, repeatsUsed?: number }} input
 * @returns {boolean}
 */
const canRepeat = (input) => {
  const state = input || {};
  if (!state.anchorIsTop2) return false;
  if (state.unseenRemaining) return false;
  return (state.repeatsUsed || 0) < config.maxRepeatsPer10;
};

module.exports = {
  seenStatus,
  orderRepeats,
  canRepeat,
};
