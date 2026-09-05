/**
 * Stable content identity across music/album/clip/concert id namespaces.
 *
 * @module recommendation-music/utils/contentKey
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');

const CONTENT_TYPES = scoringWeights.contentTypes;

/**
 * @param {unknown} contentType
 * @returns {string}
 */
const normalizeContentType = (contentType) => {
  const raw = String(contentType || '')
    .trim()
    .toLowerCase();
  if (raw === 'klip') return 'clip';
  if (raw === 'konsert') return 'concert';
  if (raw === 'musicalbom' || raw === 'music_album' || raw === 'albums') return 'album';
  return raw;
};

/**
 * @param {unknown} contentType
 * @returns {boolean}
 */
const isValidContentType = (contentType) =>
  CONTENT_TYPES.includes(normalizeContentType(contentType));

/**
 * @param {unknown} contentType
 * @param {unknown} contentId
 * @returns {string}
 */
const toContentKey = (contentType, contentId) => {
  const type = normalizeContentType(contentType);
  const id = String(contentId ?? '').trim();
  if (!type || !id) return '';
  return `${type}:${id}`;
};

/**
 * @param {unknown} contentKey
 * @returns {{ contentType: string, contentId: string }|null}
 */
const parseContentKey = (contentKey) => {
  const raw = String(contentKey || '').trim();
  const idx = raw.indexOf(':');
  if (idx <= 0) return null;
  const contentType = normalizeContentType(raw.slice(0, idx));
  const contentId = raw.slice(idx + 1).trim();
  if (!isValidContentType(contentType) || !contentId) return null;
  return { contentType, contentId };
};

/**
 * @param {import('../types/musicRecommendation.types').MusicContent|Object} content
 * @returns {string}
 */
const contentKeyFromDoc = (content) => {
  if (!content || typeof content !== 'object') return '';
  if (content.contentKey) return String(content.contentKey);
  return toContentKey(content.contentType, content.id);
};

module.exports = {
  CONTENT_TYPES,
  normalizeContentType,
  isValidContentType,
  toContentKey,
  parseContentKey,
  contentKeyFromDoc,
};
