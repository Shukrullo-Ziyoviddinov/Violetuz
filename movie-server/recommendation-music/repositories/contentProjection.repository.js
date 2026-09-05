/**
 * Unified music/album/clip/concert projections for scoring.
 *
 * @module recommendation-music/repositories/contentProjection.repository
 */

'use strict';

const Music = require('../../models/Music.model');
const Album = require('../../models/Album.model');
const Clip = require('../../models/Clip.model');
const Concert = require('../../models/Concert.model');
const { scoringWeights } = require('../config/scoringWeights');
const {
  toContentKey,
  normalizeContentType,
  isValidContentType,
  parseContentKey,
} = require('../utils/contentKey');

const SCORE_PROJECTION = Object.freeze({
  _id: 0,
  id: 1,
  categoryNameMusic: 1,
  genre: 1,
  country: 1,
  language: 1,
  artistId: 1,
  year: 1,
  like: 1,
  durationSec: 1,
  type: 1,
  title: 1,
  img: 1,
});

const MODEL_BY_TYPE = Object.freeze({
  music: Music,
  album: Album,
  clip: Clip,
  concert: Concert,
});

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
};

/**
 * @param {Object} doc
 * @param {string} contentType
 * @returns {import('../types/musicRecommendation.types').MusicContent}
 */
const normalizeDoc = (doc, contentType) => {
  const type = normalizeContentType(contentType);
  return {
    ...doc,
    contentType: type,
    contentKey: toContentKey(type, doc.id),
    categoryNameMusic: doc.categoryNameMusic,
    releaseYear: typeof doc.year === 'number' ? doc.year : null,
  };
};

/**
 * @param {string} contentType
 * @param {string|number} contentId
 * @returns {Promise<import('../types/musicRecommendation.types').MusicContent|null>}
 */
const findContentProjection = async (contentType, contentId) => {
  const type = normalizeContentType(contentType);
  if (!isValidContentType(type)) return null;

  const idStr = String(contentId ?? '').trim();
  if (!idStr) return null;

  const numericId = Number(idStr);
  const useNumeric = Number.isInteger(numericId) && String(numericId) === idStr;
  if (!useNumeric) return null;

  const Model = MODEL_BY_TYPE[type];
  const doc = await Model.findOne({ id: numericId }).select(SCORE_PROJECTION).lean();
  if (!doc) return null;
  return normalizeDoc(doc, type);
};

/**
 * @param {string} contentKey
 * @returns {Promise<import('../types/musicRecommendation.types').MusicContent|null>}
 */
const findContentProjectionByKey = async (contentKey) => {
  const parsed = parseContentKey(contentKey);
  if (!parsed) return null;
  return findContentProjection(parsed.contentType, parsed.contentId);
};

/**
 * @param {string} categoryNameMusic
 * @param {string} contentType
 * @param {number} [limit]
 * @returns {Promise<import('../types/musicRecommendation.types').MusicContent[]>}
 */
const findByCategoryAndType = async (categoryNameMusic, contentType, limit = 400) => {
  const category = String(categoryNameMusic || '').trim();
  const type = normalizeContentType(contentType);
  if (!category || !isValidContentType(type)) return [];

  const Model = MODEL_BY_TYPE[type];
  const docs = await Model.aggregate([
    { $match: { categoryNameMusic: category } },
    {
      $addFields: {
        _likeNum: {
          $convert: { input: '$like', to: 'double', onError: 0, onNull: 0 },
        },
        _year: { $ifNull: ['$year', 0] },
      },
    },
    { $sort: { _likeNum: -1, _year: -1, id: -1 } },
    { $limit: Math.max(1, limit) },
    {
      $project: {
        _id: 0,
        id: 1,
        categoryNameMusic: 1,
        genre: 1,
        country: 1,
        language: 1,
        artistId: 1,
        year: 1,
        like: 1,
        durationSec: 1,
        type: 1,
        title: 1,
        img: 1,
      },
    },
  ]);

  return docs.map((doc) => normalizeDoc(doc, type));
};

/**
 * Popular slice across enabled content types for a categoryNameMusic.
 *
 * @param {string} categoryNameMusic
 * @param {Object} [opts]
 * @param {string[]} [opts.contentTypes]
 * @param {number} [opts.limit]
 */
const findContentsByCategory = async (categoryNameMusic, opts = {}) => {
  const limit = Math.max(1, Number(opts.limit) || 300);
  const types = (opts.contentTypes || scoringWeights.contentTypes)
    .map(normalizeContentType)
    .filter(isValidContentType);

  if (!types.length) return [];

  const perType = Math.max(1, Math.ceil(limit / types.length));
  const batches = await Promise.all(
    types.map((type) => findByCategoryAndType(categoryNameMusic, type, perType))
  );

  const merged = batches.flat();
  merged.sort((a, b) => {
    const likeA = Number(a.like) || 0;
    const likeB = Number(b.like) || 0;
    if (likeB !== likeA) return likeB - likeA;
    return (b.releaseYear || 0) - (a.releaseYear || 0);
  });

  return merged.slice(0, limit);
};

/**
 * Niche expand by affinity seeds.
 *
 * @param {string} categoryNameMusic
 * @param {Object} seeds
 * @param {Object} [opts]
 */
const findContentsByAffinitySeeds = async (categoryNameMusic, seeds = {}, opts = {}) => {
  const category = String(categoryNameMusic || '').trim();
  if (!category) return [];

  const genres = Array.isArray(seeds.genres) ? seeds.genres.filter(Boolean) : [];
  const countries = Array.isArray(seeds.countries) ? seeds.countries.filter(Boolean) : [];
  const languages = Array.isArray(seeds.languages) ? seeds.languages.filter(Boolean) : [];
  const artists = Array.isArray(seeds.artists) ? seeds.artists.filter(Boolean).map(String) : [];

  /** @type {Object[]} */
  const orClauses = [];
  if (genres.length) orClauses.push({ genre: { $in: genres } });
  if (countries.length) orClauses.push({ country: { $in: countries } });
  if (languages.length) orClauses.push({ language: { $in: languages } });
  if (artists.length) orClauses.push({ artistId: { $in: artists } });
  if (!orClauses.length) return [];

  const excludeKeys = new Set((opts.excludeKeys || []).map(String));
  const limit = Math.max(1, Number(opts.limit) || 150);
  const types = (opts.contentTypes || scoringWeights.contentTypes)
    .map(normalizeContentType)
    .filter(isValidContentType);

  const perType = Math.max(1, Math.ceil(limit / Math.max(1, types.length)));
  /** @type {import('../types/musicRecommendation.types').MusicContent[]} */
  const out = [];

  for (const type of types) {
    const Model = MODEL_BY_TYPE[type];
    const match = {
      categoryNameMusic: category,
      $or: orClauses,
    };

    const docs = await Model.aggregate([
      { $match: match },
      {
        $addFields: {
          _likeNum: {
            $convert: { input: '$like', to: 'double', onError: 0, onNull: 0 },
          },
          _year: { $ifNull: ['$year', 0] },
        },
      },
      { $sort: { _likeNum: -1, _year: -1, id: -1 } },
      { $limit: perType + excludeKeys.size },
      {
        $project: {
          _id: 0,
          id: 1,
          categoryNameMusic: 1,
          genre: 1,
          country: 1,
          language: 1,
          artistId: 1,
          year: 1,
          like: 1,
          durationSec: 1,
          type: 1,
          title: 1,
          img: 1,
        },
      },
    ]);

    for (const doc of docs) {
      const normalized = normalizeDoc(doc, type);
      if (excludeKeys.has(normalized.contentKey)) continue;
      out.push(normalized);
      if (out.length >= limit) return out;
    }
  }

  return out.slice(0, limit);
};

/**
 * @param {string} categoryNameMusic
 * @param {Object} [opts]
 */
const buildCategoryCandidatePool = async (categoryNameMusic, opts = {}) => {
  const popularLimit = Math.max(1, Number(opts.popularLimit) || 300);
  const affinityLimit = Math.max(0, Number(opts.affinityLimit) || 150);
  const contentTypes = opts.contentTypes;

  const popular = await findContentsByCategory(categoryNameMusic, {
    limit: popularLimit,
    contentTypes,
  });

  const affinityMap = opts.affinityMap;
  if (!affinityLimit || !affinityMap || typeof affinityMap !== 'object') {
    return popular;
  }

  const topKeys = (dimMap, n) => {
    if (!dimMap || typeof dimMap !== 'object' || n <= 0) return [];
    return Object.entries(dimMap)
      .filter(([, score]) => typeof score === 'number' && score > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key]) => key);
  };

  const seeds = {
    genres: topKeys(affinityMap.genre, Number(opts.seedGenres) || 5),
    countries: topKeys(affinityMap.country, Number(opts.seedCountries) || 3),
    languages: topKeys(affinityMap.language, Number(opts.seedLanguages) || 3),
    artists: topKeys(affinityMap.artist, Number(opts.seedArtists) || 8),
  };

  if (
    !seeds.genres.length &&
    !seeds.countries.length &&
    !seeds.languages.length &&
    !seeds.artists.length
  ) {
    return popular;
  }

  const extra = await findContentsByAffinitySeeds(categoryNameMusic, seeds, {
    excludeKeys: popular.map((c) => c.contentKey),
    limit: affinityLimit,
    contentTypes,
  });

  if (!extra.length) return popular;

  const seen = new Set(popular.map((c) => c.contentKey));
  const merged = [...popular];
  for (const item of extra) {
    if (seen.has(item.contentKey)) continue;
    seen.add(item.contentKey);
    merged.push(item);
  }
  return merged;
};

/**
 * Hydrate cache rows preserving order.
 *
 * @param {Array<{ contentKey: string, contentType?: string, contentId?: string }|string>} keys
 * @returns {Promise<Object[]>}
 */
const findContentsByKeysPreserveOrder = async (keys) => {
  /** @type {Array<{ contentType: string, contentId: string, contentKey: string }>} */
  const parsed = [];
  for (const row of keys || []) {
    if (typeof row === 'string') {
      const p = parseContentKey(row);
      if (p) parsed.push({ ...p, contentKey: row });
      continue;
    }
    if (row?.contentKey) {
      const p = parseContentKey(row.contentKey);
      if (p) parsed.push({ ...p, contentKey: row.contentKey });
      continue;
    }
    if (row?.contentType && row?.contentId != null) {
      const contentKey = toContentKey(row.contentType, row.contentId);
      const p = parseContentKey(contentKey);
      if (p) parsed.push({ ...p, contentKey });
    }
  }

  if (!parsed.length) return [];

  /** @type {Map<string, number[]>} */
  const idsByType = new Map();
  for (const p of parsed) {
    const n = Number(p.contentId);
    if (!Number.isInteger(n) || n <= 0) continue;
    if (!idsByType.has(p.contentType)) idsByType.set(p.contentType, []);
    idsByType.get(p.contentType).push(n);
  }

  /** @type {Map<string, Object>} */
  const byKey = new Map();

  await Promise.all(
    [...idsByType.entries()].map(async ([type, ids]) => {
      const Model = MODEL_BY_TYPE[type];
      const uniqueIds = [...new Set(ids)];
      const docs = await Model.find({ id: { $in: uniqueIds } }).lean();
      for (const doc of docs) {
        const plain = stripMongoId(doc);
        const contentKey = toContentKey(type, plain.id);
        byKey.set(contentKey, {
          ...plain,
          contentType: type,
          contentKey,
        });
      }
    })
  );

  return parsed.map((p) => byKey.get(p.contentKey)).filter(Boolean);
};

module.exports = {
  SCORE_PROJECTION,
  findContentProjection,
  findContentProjectionByKey,
  findContentsByCategory,
  findContentsByAffinitySeeds,
  buildCategoryCandidatePool,
  findContentsByKeysPreserveOrder,
};
