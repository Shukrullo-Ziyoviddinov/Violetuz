/**
 * Login "Siz uchun".
 * userId faqat auth sessiyadan keladi.
 * Natija home_feed_cache ga yoziladi. Bo'lim tavsiya jadvaliga emas.
 *
 * @module home-feed/services/loginFeed.service
 */

'use strict';

const { homeFeedWeights } = require('../config/homeFeedWeights');
const { buildHomeFeed } = require('../rank/buildFeed');
const {
  listHomeFeedCache,
  replaceHomeFeedCache,
} = require('../repositories/homeFeedCache.repository');
const { parseUserId } = require('../repositories/parseUserId');

/**
 * @param {Date|string|number|null|undefined} value
 * @returns {number|null}
 */
const toEpochMs = (value) => {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
};

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {number} [nowMs]
 * @returns {Promise<{ movies: Object[], source: 'cache'|'computed' }>}
 */
const getLoginHomeFeed = async (userId, nowMs = Date.now()) => {
  const uid = parseUserId(userId);
  if (!uid) {
    const err = new Error('userId majburiy (auth)');
    err.status = 401;
    throw err;
  }

  const cached = await listHomeFeedCache(uid);
  const generatedMs = toEpochMs(cached[0]?.generatedAt);
  const maxAge = homeFeedWeights.precomputeIntervalMs;
  const fresh = cached.length > 0
    && generatedMs != null
    && nowMs - generatedMs < maxAge;

  if (fresh) {
    return {
      movies: cached.map(({ generatedAt, ...row }) => row),
      source: 'cache',
    };
  }

  const built = await buildHomeFeed({ userId: uid, nowMs });
  await replaceHomeFeedCache(uid, built.movies);

  return {
    movies: built.movies,
    source: 'computed',
  };
};

module.exports = {
  getLoginHomeFeed,
};
