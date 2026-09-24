/**
 * Login "Sizga mos musiqalar".
 * userId faqat auth sessiyadan keladi.
 * Natija music_home_feed_cache ga yoziladi. Kino keshi va bo'lim jadvali ochilmaydi.
 *
 * @module music-home-feed/services/loginFeed.service
 */

'use strict';

const { musicHomeFeedWeights } = require('../config/musicHomeFeedWeights');
const { buildMusicFeed } = require('../rank/buildFeed');
const {
  listMusicHomeFeedCache,
  replaceMusicHomeFeedCache,
} = require('../repositories/musicHomeFeedCache.repository');
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
 * @returns {Promise<{ tracks: Object[], source: 'cache'|'computed' }>}
 */
const getLoginMusicFeed = async (userId, nowMs = Date.now()) => {
  const uid = parseUserId(userId);
  if (!uid) {
    const err = new Error('userId majburiy (auth)');
    err.status = 401;
    throw err;
  }

  const cached = await listMusicHomeFeedCache(uid);
  const generatedMs = toEpochMs(cached[0]?.generatedAt);
  const maxAge = musicHomeFeedWeights.precomputeIntervalMs;
  const fresh = cached.length > 0
    && generatedMs != null
    && nowMs - generatedMs < maxAge;

  if (fresh) {
    return {
      tracks: cached.map(({ generatedAt, ...row }) => row),
      source: 'cache',
    };
  }

  const built = await buildMusicFeed({ userId: uid, nowMs });
  await replaceMusicHomeFeedCache(uid, built.tracks);

  return {
    tracks: built.tracks,
    source: 'computed',
  };
};

module.exports = {
  getLoginMusicFeed,
};
