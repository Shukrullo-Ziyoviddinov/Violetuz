/**
 * Qo'shiq katalogi — faqat o'qish.
 * Collection: music. Albom, klip va konsert ochilmaydi.
 * Janr — genre. categoryNameMusic bo'lim, janr emas.
 *
 * @module music-mixes/repositories/catalog.read
 */

'use strict';

const Music = require('../../models/Music.model');
const { musicMixWeights } = require('../config/musicMixWeights');

const SONG_TYPE = 'music';
const EXCLUDED_TYPES = Object.freeze(['album', 'clip', 'concert']);

const CATALOG_SELECT = Object.freeze({
  _id: 0,
  id: 1,
  genre: 1,
  durationSec: 1,
  categoryNameMusic: 1,
  type: 1,
});

/**
 * @param {unknown} genre
 * @returns {string}
 */
const resolveMixGenre = (genre) => {
  const name = String(genre || '').trim();
  if (name) return name;
  return String(musicMixWeights.unknownGenre || 'Boshqa').trim() || 'Boshqa';
};

/**
 * @param {Array<string|number>} contentIds
 * @returns {number[]}
 */
const numericIds = (contentIds) => [
  ...new Set(
    (contentIds || [])
      .map((id) => Number(String(id).trim()))
      .filter((id) => Number.isInteger(id))
  ),
];

/**
 * Music kolleksiyasidagi qo'shiq. type bo'sh bo'lsa ham qo'shiq.
 * Albom, klip, konsert tushib qoladi.
 * @returns {Object}
 */
const catalogSongMatch = () => ({
  $or: [
    { type: SONG_TYPE },
    { type: { $exists: false } },
    { type: null },
    { type: '' },
  ],
  type: { $nin: EXCLUDED_TYPES },
});

/**
 * @param {Object} row
 * @returns {{ contentId: string, genre: string, durationSec: number|null, section: string }|null}
 */
const toMixSong = (row) => {
  const type = String(row?.type || SONG_TYPE).trim();
  if (EXCLUDED_TYPES.includes(type)) return null;
  const contentId = String(row?.id ?? '').trim();
  if (!contentId) return null;
  const duration = Number(row.durationSec);
  return {
    contentId,
    genre: resolveMixGenre(row.genre),
    durationSec: Number.isFinite(duration) && duration > 0 ? duration : null,
    section: String(row.categoryNameMusic || '').trim(),
  };
};

/**
 * @param {Array<string|number>} contentIds
 * @returns {Promise<Array<{ contentId: string, genre: string, durationSec: number|null, section: string }>>}
 */
const findMixSongsByIds = async (contentIds) => {
  const ids = numericIds(contentIds);
  if (!ids.length) return [];

  const rows = await Music.find({ id: { $in: ids }, ...catalogSongMatch() })
    .select(CATALOG_SELECT)
    .lean();

  const out = [];
  for (const row of rows || []) {
    const song = toMixSong(row);
    if (song) out.push(song);
  }
  return out;
};

module.exports = {
  resolveMixGenre,
  catalogSongMatch,
  findMixSongsByIds,
};
