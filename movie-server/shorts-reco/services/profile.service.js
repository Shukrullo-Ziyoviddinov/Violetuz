'use strict';

const config = require('../config');
const { actorProfileKey } = require('../utils/keys');
const { DAY_MS } = require('../utils/time');
const { movieEngagementDelta, skipPenaltyAmount } = require('./actors.service');
const { BUCKETS, emptyLongTerm, portionsOf, effectiveScore } = require('./contributions');

/**
 * @param {string} userId
 * @param {Date} now
 */
const emptyProfile = (userId, now) => ({
  userId,
  longTerm: emptyLongTerm(),
  session: { items: [] },
  anchorMultipliers: {},
  /** Locks and fatigue flags stop a later feed call from halving the same anchor again. */
  anchorLocks: {},
  anchorFatigue: {},
  anchorPinned: null,
  decayedAt: now,
  updatedAt: now,
});

/**
 * @param {object} profile
 * @param {string} bucket
 * @param {string} key
 * @param {number} delta
 */
const addMapValue = (profile, bucket, key, delta) => {
  if (!key || !delta) return;
  const map = profile.longTerm[bucket];
  const next = (map[key] || 0) + delta;
  if (Math.abs(next) < config.profilePruneAbs) delete map[key];
  else map[key] = next;
};

/**
 * Profile is already decayed. `decayFactor` is how much the previous
 * contribution was shrunk, so this short replaces its own share.
 * @param {object} profile
 * @param {object} catalog
 * @param {number} oldScore
 * @param {number} newScore
 * @param {number} decayFactor
 */
const applyScoreChange = (profile, catalog, oldScore, newScore, decayFactor) => {
  const factor = decayFactor == null ? 1 : decayFactor;
  const portions = portionsOf(catalog);
  for (let i = 0; i < portions.length; i += 1) {
    const part = portions[i];
    const before = part.portion * effectiveScore(oldScore, part.kind) * factor;
    const after = part.portion * effectiveScore(newScore, part.kind);
    addMapValue(profile, part.bucket, part.key, after - before);
  }

  if (catalog.movieId == null) return;
  const movieKey = String(catalog.movieId);
  const engagement = movieEngagementDelta(catalog.type, oldScore, newScore, factor);
  addMapValue(profile, 'movieEngagementRaw', movieKey, engagement);
  if ((profile.longTerm.movieEngagementRaw[movieKey] || 0) < 0) {
    delete profile.longTerm.movieEngagementRaw[movieKey];
  }
};

/**
 * @param {object} profile
 * @param {string[]} actorIds
 * @param {number} oldScore
 * @param {number} newScore
 * @param {number} decayFactor
 */
const applyActorPenalty = (profile, actorIds, oldScore, newScore, decayFactor) => {
  const factor = decayFactor == null ? 1 : decayFactor;
  const delta = skipPenaltyAmount(newScore) - skipPenaltyAmount(oldScore) * factor;
  for (let i = 0; i < actorIds.length; i += 1) {
    const key = actorProfileKey(actorIds[i]);
    if (!key) continue;
    const next = (profile.longTerm.actorPenalty[key] || 0) + delta;
    if (next <= config.profilePruneAbs) delete profile.longTerm.actorPenalty[key];
    else profile.longTerm.actorPenalty[key] = next;
  }
};

/**
 * @param {object|null|undefined} doc
 * @param {string} userId
 * @param {Date} now
 */
const hydrateProfile = (doc, userId, now) => {
  const profile = doc
    ? { ...doc, longTerm: { ...emptyLongTerm(), ...(doc.longTerm || {}) } }
    : emptyProfile(userId, now);
  profile.userId = userId;
  for (let i = 0; i < BUCKETS.length; i += 1) {
    const bucket = BUCKETS[i];
    if (!profile.longTerm[bucket] || typeof profile.longTerm[bucket] !== 'object') {
      profile.longTerm[bucket] = {};
    }
  }
  const items = profile.session && Array.isArray(profile.session.items) ? profile.session.items : [];
  profile.session = { items };
  profile.anchorMultipliers = profile.anchorMultipliers || {};
  profile.anchorLocks = profile.anchorLocks || {};
  profile.anchorFatigue = profile.anchorFatigue || {};
  if (profile.anchorPinned == null) profile.anchorPinned = null;
  return profile;
};

/**
 * @param {object} profile
 * @param {Date} now
 * @returns {number}
 */
const decayProfile = (profile, now) => {
  const previous = profile.decayedAt ? new Date(profile.decayedAt).getTime() : now.getTime();
  const days = (now.getTime() - previous) / DAY_MS;
  const factor = days <= 0 ? 1 : (1 - config.dailyDecay) ** days;
  if (factor !== 1) {
    for (let i = 0; i < BUCKETS.length; i += 1) {
      const bucket = profile.longTerm[BUCKETS[i]];
      const keys = Object.keys(bucket);
      for (let k = 0; k < keys.length; k += 1) {
        const key = keys[k];
        const next = bucket[key] * factor;
        if (Math.abs(next) < config.profilePruneAbs) delete bucket[key];
        else bucket[key] = next;
      }
    }
  }
  profile.decayedAt = now;
  return factor;
};

/**
 * @param {object} catalog
 */
const sessionRefs = (catalog) => ({
  type: catalog.type,
  contentType: catalog.contentType || null,
  movieId: catalog.movieId == null ? null : catalog.movieId,
  musicKey: catalog.musicKey || null,
  songGroupId: catalog.songGroupId || null,
  artistId: catalog.artistId || null,
  movieGenres: catalog.movieGenres || [],
  movieTypeCategories: catalog.movieTypeCategories || [],
  movieCountries: catalog.movieCountries || [],
  musicGenres: catalog.musicGenres || [],
  musicCountries: catalog.musicCountries || [],
});

/**
 * The same short stays one entry and moves to the end.
 * @param {{ items: object[] }} session
 * @param {object} entry
 */
const pushSession = (session, entry) => {
  const kept = (session.items || []).filter((item) => item.shortId !== entry.shortId);
  kept.push(entry);
  while (kept.length > config.sessionWindow) kept.shift();
  return { items: kept };
};

module.exports = {
  emptyProfile,
  hydrateProfile,
  applyScoreChange,
  applyActorPenalty,
  decayProfile,
  sessionRefs,
  pushSession,
};
