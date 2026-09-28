/**
 * Mix qatori turi. Algoritm shu faylda emas.
 * music — qo'shiq. klip — video. Eski qatorlar music.
 *
 * @module music-mixes/contentType
 */

'use strict';

const MIX_CONTENT_TYPES = Object.freeze(['music', 'klip']);

const normalizeMixContentType = (raw) => {
  const value = String(raw || '').trim().toLowerCase();
  if (value === 'clip') return 'klip';
  if (MIX_CONTENT_TYPES.includes(value)) return value;
  return 'music';
};

module.exports = {
  MIX_CONTENT_TYPES,
  normalizeMixContentType,
};
