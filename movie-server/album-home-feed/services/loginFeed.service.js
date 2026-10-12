/**
 * Login "Siz uchun albomlar".
 * userId faqat auth sessiyadan keladi.
 * Natija album_home_feed_cache ga yoziladi.
 * music_home_feed_cache va bo'lim jadvali ochilmaydi.
 *
 * @module album-home-feed/services/loginFeed.service
 */

'use strict';

const { albumHomeFeedWeights } = require('../config/albumHomeFeedWeights');
const { buildAlbumFeed } = require('../rank/buildFeed');
const {
  listAlbumHomeFeedCache,
  replaceAlbumHomeFeedCache,
} = require('../repositories/albumHomeFeedCache.repository');
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
 * @returns {Promise<{ albums: Object[], source: 'cache'|'computed' }>}
 */
const getLoginAlbumFeed = async (userId, nowMs = Date.now()) => {
  const uid = parseUserId(userId);
  if (!uid) {
    const err = new Error('userId majburiy (auth)');
    err.status = 401;
    throw err;
  }

  const cached = await listAlbumHomeFeedCache(uid);
  const generatedMs = toEpochMs(cached[0]?.generatedAt);
  const maxAge = albumHomeFeedWeights.precomputeIntervalMs;
  const fresh = cached.length > 0
    && generatedMs != null
    && nowMs - generatedMs < maxAge;

  if (fresh) {
    return {
      albums: cached.map(({ generatedAt, ...row }) => row),
      source: 'cache',
    };
  }

  const built = await buildAlbumFeed({ userId: uid, nowMs });
  await replaceAlbumHomeFeedCache(uid, built.albums);

  return {
    albums: built.albums,
    source: 'computed',
  };
};

module.exports = {
  getLoginAlbumFeed,
};
