/**
 * Faqat albom. Musiqa, klip, konsert o'qishdan tushadi.
 *
 * @module album-home-feed/repositories/albumContent
 */

'use strict';

const { albumHomeFeedWeights } = require('../config/albumHomeFeedWeights');

const albumContentType = () =>
  String(albumHomeFeedWeights.contentType || 'album').trim() || 'album';

const excludedContentTypes = () =>
  (albumHomeFeedWeights.excludedContentTypes || [])
    .map((name) => String(name || '').trim())
    .filter(Boolean);

/**
 * @param {string} contentType
 * @returns {boolean}
 */
const isAlbumContentType = (contentType) =>
  String(contentType || '').trim() === albumContentType();

/**
 * Tavsiya, trend, progress va tinglash hodisasi jadvallaridagi contentType.
 * @returns {{ contentType: string }}
 */
const albumContentMatch = () => ({
  contentType: albumContentType(),
});

module.exports = {
  albumContentType,
  excludedContentTypes,
  isAlbumContentType,
  albumContentMatch,
};
