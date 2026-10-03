/**
 * Music / Clip / Album katalogi — faqat o'qish (music-similar ichida).
 * Concert similar yo'q — skip.
 * movie-similar / recommendation catalog helperlariga ulanmaydi.
 *
 * @module music-similar/repositories/catalog.read
 */

'use strict';

const Music = require('../../models/Music.model');
const Clip = require('../../models/Clip.model');
const Album = require('../../models/Album.model');
const { similarityWeights } = require('../config/similarityWeights');

const CONTENT_TYPES = new Set(similarityWeights.contentTypes);

const MODEL_BY_TYPE = Object.freeze({
  music: Music,
  klip: Clip,
  album: Album,
});

/**
 * @param {unknown} value
 * @returns {'music'|'klip'|'album'|null}
 */
const normalizeContentType = (value) => {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  if (raw === 'clip') return 'klip';
  if (raw === 'musicalbom' || raw === 'music_album') return 'album';
  if (CONTENT_TYPES.has(raw)) return /** @type {'music'|'klip'|'album'} */ (raw);
  return null;
};

/**
 * @param {unknown} value
 * @returns {number|null}
 */
const toCatalogId = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * @param {Array<string|number>} ids
 * @returns {number[]}
 */
const uniqueCatalogIds = (ids) => [
  ...new Set(
    (ids || [])
      .map((id) => toCatalogId(id))
      .filter((id) => id != null)
  ),
];

/**
 * @param {'music'|'klip'|'album'} contentType
 * @returns {Record<string, 1>}
 */
const catalogSelectForType = (contentType) => {
  /** @type {Record<string, 1>} */
  const select = {
    _id: 0,
    id: 1,
    title: 1,
    artistId: 1,
    genre: 1,
    year: 1,
    country: 1,
    language: 1,
    type: 1,
    img: 1,
    categoryNameMusic: 1,
  };

  if (contentType === 'music') {
    select.audio = 1;
    select.franchiseMusicIds = 1;
  } else if (contentType === 'klip') {
    select.video = 1;
    select.franchiseClipIds = 1;
  } else if (contentType === 'album') {
    select.artist = 1;
  }

  return select;
};

/**
 * @param {unknown} contentType
 * @returns {import('mongoose').Model|null}
 */
const modelForType = (contentType) => {
  const type = normalizeContentType(contentType);
  if (!type) return null;
  return MODEL_BY_TYPE[type] || null;
};

/**
 * Bitta yozuv (engine / API).
 * @param {unknown} contentType
 * @param {string|number} id
 * @returns {Promise<object|null>}
 */
const findCatalogItemById = async (contentType, id) => {
  const type = normalizeContentType(contentType);
  const catalogId = toCatalogId(id);
  const Model = modelForType(type);
  if (!type || catalogId == null || !Model) return null;

  return Model.findOne({ id: catalogId })
    .select(catalogSelectForType(type))
    .lean();
};

/**
 * Bir type bo'yicha butun katalog — precompute uchun.
 * @param {unknown} contentType
 * @returns {Promise<object[]>}
 */
const listAllCatalogItems = async (contentType) => {
  const type = normalizeContentType(contentType);
  const Model = modelForType(type);
  if (!type || !Model) return [];

  return Model.find({}).select(catalogSelectForType(type)).lean();
};

/**
 * Id ro'yxati bo'yicha (cache hydrate). Bir xil type ichida.
 * @param {unknown} contentType
 * @param {Array<string|number>} ids
 * @returns {Promise<object[]>}
 */
const findCatalogItemsByIds = async (contentType, ids) => {
  const type = normalizeContentType(contentType);
  const Model = modelForType(type);
  const catalogIds = uniqueCatalogIds(ids);
  if (!type || !Model || !catalogIds.length) return [];

  const rows = await Model.find({ id: { $in: catalogIds } })
    .select(catalogSelectForType(type))
    .lean();
  const byId = new Map(rows.map((row) => [Number(row.id), row]));
  return catalogIds.map((id) => byId.get(id)).filter(Boolean);
};

/**
 * Kandidat pool — faqat shu contentType (cross-type yo'q).
 * @param {unknown} contentType
 * @param {{ excludeIds?: Array<string|number> }} [opts]
 * @returns {Promise<object[]>}
 */
const listCandidatePool = async (contentType, opts = {}) => {
  const type = normalizeContentType(contentType);
  const Model = modelForType(type);
  if (!type || !Model) return [];

  /** @type {Record<string, unknown>} */
  const filter = {};
  const exclude = uniqueCatalogIds(opts.excludeIds);
  if (exclude.length) {
    filter.id = { $nin: exclude };
  }

  return Model.find(filter).select(catalogSelectForType(type)).lean();
};

/**
 * Franshiza maydon nomi (album / concert → null).
 * @param {unknown} contentType
 * @returns {string|null}
 */
const franchiseFieldForType = (contentType) => {
  const type = normalizeContentType(contentType);
  if (!type) return null;
  return similarityWeights.franchiseFieldByType[type] || null;
};

module.exports = {
  normalizeContentType,
  toCatalogId,
  uniqueCatalogIds,
  catalogSelectForType,
  franchiseFieldForType,
  findCatalogItemById,
  listAllCatalogItems,
  findCatalogItemsByIds,
  listCandidatePool,
};
