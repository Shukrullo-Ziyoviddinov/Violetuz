/**
 * Albom katalogi — faqat o'qish.
 * Collection: musicAlbums. Trek (music) va klip kolleksiyalari ochilmaydi.
 *
 * @module album-home-feed/repositories/catalog.read
 */

'use strict';

const Album = require('../../models/Album.model');

/** Katalogdagi albom type. Musiqa, klip, konsert qabul qilinmaydi. */
const ALBUM_CATALOG_TYPES = Object.freeze(['musicAlbom', 'album', 'music_album']);

const CATALOG_SELECT = Object.freeze({
  _id: 0,
  id: 1,
  categoryNameMusic: 1,
  genre: 1,
  country: 1,
  language: 1,
  artistId: 1,
  artist: 1,
  year: 1,
  type: 1,
});

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
 * musicAlbums ichida faqat albom.
 * @returns {{ type: { $in: string[] } }}
 */
const catalogAlbumMatch = () => ({
  type: { $in: [...ALBUM_CATALOG_TYPES] },
});

/**
 * @param {Object} [filter]
 * @param {number} [limit]
 * @param {Object} [sort]
 * @returns {Promise<Object[]>}
 */
const findCatalogAlbums = async (filter = {}, limit = 200, sort = { year: -1, id: -1 }) => {
  const rows = await Album.find({ ...catalogAlbumMatch(), ...filter })
    .select(CATALOG_SELECT)
    .sort(sort)
    .limit(Math.max(1, limit))
    .lean();
  return rows || [];
};

/**
 * @param {Array<string|number>} contentIds
 * @returns {Promise<Object[]>}
 */
const findCatalogAlbumsByIds = async (contentIds) => {
  const ids = numericIds(contentIds);
  if (!ids.length) return [];

  const rows = await Album.find({ id: { $in: ids }, ...catalogAlbumMatch() })
    .select(CATALOG_SELECT)
    .lean();
  return rows || [];
};

/**
 * Tartib uchun bo'lim va ijrochi.
 *
 * @param {Array<string|number>} contentIds
 * @returns {Promise<Map<string, { category: string, artistId: string, genre: string }>>}
 */
const findRankMetaByIds = async (contentIds) => {
  const ids = numericIds(contentIds);
  /** @type {Map<string, { category: string, artistId: string, genre: string }>} */
  const map = new Map();
  if (!ids.length) return map;

  const rows = await Album.find({ id: { $in: ids }, ...catalogAlbumMatch() })
    .select({ _id: 0, id: 1, categoryNameMusic: 1, artistId: 1, genre: 1 })
    .lean();

  for (const row of rows || []) {
    const contentId = String(row.id ?? '').trim();
    const category = String(row.categoryNameMusic || '').trim();
    if (!contentId || !category) continue;
    map.set(contentId, {
      category,
      artistId: String(row.artistId || '').trim(),
      genre: String(row.genre || '').trim(),
    });
  }
  return map;
};

module.exports = {
  ALBUM_CATALOG_TYPES,
  catalogAlbumMatch,
  findCatalogAlbums,
  findCatalogAlbumsByIds,
  findRankMetaByIds,
};
