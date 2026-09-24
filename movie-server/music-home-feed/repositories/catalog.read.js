/**
 * Qo'shiq katalogi — faqat o'qish.
 * Collection: music. Albom va klip kolleksiyalari ochilmaydi.
 *
 * @module music-home-feed/repositories/catalog.read
 */

'use strict';

const Music = require('../../models/Music.model');
const { musicContentType } = require('./musicContent');

const CATALOG_SELECT = Object.freeze({
  _id: 0,
  id: 1,
  categoryNameMusic: 1,
  genre: 1,
  country: 1,
  language: 1,
  artistId: 1,
  year: 1,
  durationSec: 1,
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
 * Music kolleksiyasi qo‘shiq. type bo‘sh bo‘lsa ham qo‘shiq hisoblanadi.
 * @returns {Object}
 */
const catalogTrackMatch = () => ({
  $or: [
    { type: musicContentType() },
    { type: { $exists: false } },
    { type: null },
    { type: '' },
  ],
});

/**
 * @param {Object} [filter]
 * @param {number} [limit]
 * @param {Object} [sort]
 * @returns {Promise<Object[]>}
 */
const findCatalogTracks = async (filter = {}, limit = 200, sort = { year: -1, id: -1 }) => {
  const rows = await Music.find({ ...catalogTrackMatch(), ...filter })
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
const findCatalogTracksByIds = async (contentIds) => {
  const ids = numericIds(contentIds);
  if (!ids.length) return [];

  const rows = await Music.find({ id: { $in: ids }, ...catalogTrackMatch() })
    .select(CATALOG_SELECT)
    .lean();
  return rows || [];
};

/**
 * @param {Array<string|number>} contentIds
 * @returns {Promise<Map<string, number|null>>}
 */
const mapDurationByIds = async (contentIds) => {
  const ids = numericIds(contentIds);
  /** @type {Map<string, number|null>} */
  const map = new Map();
  if (!ids.length) return map;

  const rows = await Music.find({ id: { $in: ids }, ...catalogTrackMatch() })
    .select({ _id: 0, id: 1, durationSec: 1 })
    .lean();

  for (const row of rows || []) {
    const contentId = String(row.id ?? '').trim();
    if (!contentId) continue;
    const duration = Number(row.durationSec);
    map.set(contentId, Number.isFinite(duration) && duration > 0 ? duration : null);
  }
  return map;
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

  const rows = await Music.find({ id: { $in: ids }, ...catalogTrackMatch() })
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
  catalogTrackMatch,
  findCatalogTracks,
  findCatalogTracksByIds,
  mapDurationByIds,
  findRankMetaByIds,
};
