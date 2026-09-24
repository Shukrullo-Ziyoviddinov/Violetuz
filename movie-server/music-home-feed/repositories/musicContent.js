/**
 * Faqat qo'shiq. Albom, klip, konsert o'qishdan tushadi.
 *
 * @module music-home-feed/repositories/musicContent
 */

'use strict';

const { musicHomeFeedWeights } = require('../config/musicHomeFeedWeights');

const musicContentType = () =>
  String(musicHomeFeedWeights.contentType || 'music').trim() || 'music';

const excludedContentTypes = () =>
  (musicHomeFeedWeights.excludedContentTypes || [])
    .map((name) => String(name || '').trim())
    .filter(Boolean);

/**
 * @param {string} contentType
 * @returns {boolean}
 */
const isMusicContentType = (contentType) =>
  String(contentType || '').trim() === musicContentType();

/**
 * Tavsiya, trend, progress va tinglash hodisasi jadvallaridagi contentType.
 * @returns {{ contentType: string }}
 */
const musicContentMatch = () => ({
  contentType: musicContentType(),
});

module.exports = {
  musicContentType,
  excludedContentTypes,
  isMusicContentType,
  musicContentMatch,
};
