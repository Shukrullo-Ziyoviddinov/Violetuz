/**
 * Hydrate cached movie ids preserving recommendation order.
 *
 * @module recommendation/repositories/movieProjection.repository
 */

'use strict';

const Movie = require('../../models/Movie.model');

const SCORE_PROJECTION = Object.freeze({
  _id: 0,
  id: 1,
  categoryName: 1,
  filterGenre: 1,
  filterCountry: 1,
  actors: 1,
  rating: 1,
  ratingImdb: 1,
  ratingKinopoisk: 1,
  like: 1,
  'specs.year': 1,
});

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
};

/**
 * @param {string|number} movieId
 * @returns {Promise<import('../types/recommendation.types').Movie|null>}
 */
const findMovieProjectionById = async (movieId) => {
  const idStr = String(movieId ?? '').trim();
  if (!idStr) return null;

  const numericId = Number(idStr);
  const useNumeric = Number.isInteger(numericId) && String(numericId) === idStr;
  if (!useNumeric) return null;

  const doc = await Movie.findOne({ id: numericId }).select(SCORE_PROJECTION).lean();
  if (!doc) return null;

  return {
    ...doc,
    releaseYear: doc.specs?.year ?? null,
  };
};

/**
 * Lightweight category candidate pool (id + affinity fields + popularity signals).
 * Sorted numerically before limit so large categories keep popular/recent titles
 * (like is stored as string — lexicographic sort would be wrong).
 * @param {string} categoryName
 * @param {number} [limit]
 * @returns {Promise<import('../types/recommendation.types').Movie[]>}
 */
const findMoviesByCategory = async (categoryName, limit = 400) => {
  const category = String(categoryName || '').trim();
  if (!category) return [];

  const docs = await Movie.aggregate([
    { $match: { categoryName: category } },
    {
      $addFields: {
        _likeNum: {
          $convert: { input: '$like', to: 'double', onError: 0, onNull: 0 },
        },
        _year: { $ifNull: ['$specs.year', 0] },
        _rating: {
          $max: [
            { $ifNull: ['$rating', 0] },
            { $ifNull: ['$ratingImdb', 0] },
            { $ifNull: ['$ratingKinopoisk', 0] },
          ],
        },
      },
    },
    // Align with cold-start signals: popularity → recency → rating
    { $sort: { _likeNum: -1, _year: -1, _rating: -1 } },
    { $limit: Math.max(1, limit) },
    {
      $project: {
        _id: 0,
        id: 1,
        categoryName: 1,
        filterGenre: 1,
        filterCountry: 1,
        actors: 1,
        rating: 1,
        ratingImdb: 1,
        ratingKinopoisk: 1,
        like: 1,
        specs: { year: '$specs.year' },
      },
    },
  ]);

  return docs.map((doc) => ({
    ...doc,
    releaseYear: doc.specs?.year ?? null,
  }));
};

/**
 * Niche expand: top affinity genre/country/actor bo‘yicha filmlar
 * (popular pool’da yo‘qlar — shaxsiy signal uchun).
 *
 * @param {string} categoryName
 * @param {Object} seeds
 * @param {string[]} [seeds.genres]
 * @param {string[]} [seeds.countries]
 * @param {Array<string|number>} [seeds.actors]
 * @param {Object} [opts]
 * @param {Array<string|number>} [opts.excludeIds]
 * @param {number} [opts.limit]
 * @returns {Promise<import('../types/recommendation.types').Movie[]>}
 */
const findMoviesByAffinitySeeds = async (categoryName, seeds = {}, opts = {}) => {
  const category = String(categoryName || '').trim();
  if (!category) return [];

  const genres = Array.isArray(seeds.genres) ? seeds.genres.filter(Boolean) : [];
  const countries = Array.isArray(seeds.countries)
    ? seeds.countries.filter(Boolean)
    : [];
  const actorsRaw = Array.isArray(seeds.actors) ? seeds.actors : [];
  const actors = [];
  for (const a of actorsRaw) {
    if (a == null || a === '') continue;
    actors.push(a);
    const n = Number(a);
    if (Number.isInteger(n) && String(n) === String(a).trim()) actors.push(n);
  }

  /** @type {Object[]} */
  const orClauses = [];
  if (genres.length) orClauses.push({ filterGenre: { $in: genres } });
  if (countries.length) orClauses.push({ filterCountry: { $in: countries } });
  if (actors.length) orClauses.push({ actors: { $in: actors } });
  if (!orClauses.length) return [];

  const excludeIds = [
    ...new Set(
      (opts.excludeIds || [])
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];
  const limit = Math.max(1, Number(opts.limit) || 150);

  /** @type {Object} */
  const match = {
    categoryName: category,
    $or: orClauses,
  };
  if (excludeIds.length) match.id = { $nin: excludeIds };

  const docs = await Movie.aggregate([
    { $match: match },
    {
      $addFields: {
        _likeNum: {
          $convert: { input: '$like', to: 'double', onError: 0, onNull: 0 },
        },
        _year: { $ifNull: ['$specs.year', 0] },
        _rating: {
          $max: [
            { $ifNull: ['$rating', 0] },
            { $ifNull: ['$ratingImdb', 0] },
            { $ifNull: ['$ratingKinopoisk', 0] },
          ],
        },
      },
    },
    { $sort: { _likeNum: -1, _year: -1, _rating: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        id: 1,
        categoryName: 1,
        filterGenre: 1,
        filterCountry: 1,
        actors: 1,
        rating: 1,
        ratingImdb: 1,
        ratingKinopoisk: 1,
        like: 1,
        specs: { year: '$specs.year' },
      },
    },
  ]);

  return docs.map((doc) => ({
    ...doc,
    releaseYear: doc.specs?.year ?? null,
  }));
};

/**
 * Popular pool + affinity niche expand (deduped by id).
 *
 * @param {string} categoryName
 * @param {Object} [opts]
 * @param {import('../types/recommendation.types').AffinityMap} [opts.affinityMap]
 * @param {number} [opts.popularLimit]
 * @param {number} [opts.affinityLimit]
 * @param {number} [opts.seedGenres]
 * @param {number} [opts.seedCountries]
 * @param {number} [opts.seedActors]
 * @returns {Promise<import('../types/recommendation.types').Movie[]>}
 */
const buildCategoryCandidatePool = async (categoryName, opts = {}) => {
  const popularLimit = Math.max(1, Number(opts.popularLimit) || 300);
  const affinityLimit = Math.max(0, Number(opts.affinityLimit) || 150);

  const popular = await findMoviesByCategory(categoryName, popularLimit);
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
    actors: topKeys(affinityMap.actor, Number(opts.seedActors) || 8),
  };

  if (!seeds.genres.length && !seeds.countries.length && !seeds.actors.length) {
    return popular;
  }

  const extra = await findMoviesByAffinitySeeds(categoryName, seeds, {
    excludeIds: popular.map((m) => m.id),
    limit: affinityLimit,
  });

  if (!extra.length) return popular;

  const seen = new Set(popular.map((m) => String(m.id)));
  const merged = [...popular];
  for (const movie of extra) {
    const id = String(movie.id);
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(movie);
  }
  return merged;
};

/**
 * Full movie docs by ids, returned in the same order as `movieIds`.
 * @param {Array<string|number>} movieIds
 * @returns {Promise<Object[]>}
 */
const findMoviesByIdsPreserveOrder = async (movieIds) => {
  const ids = [...new Set(
    (movieIds || [])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
  )];

  if (!ids.length) return [];

  const docs = await Movie.find({ id: { $in: ids } }).lean();
  const byId = new Map(docs.map((doc) => [doc.id, stripMongoId(doc)]));

  return movieIds
    .map((id) => byId.get(Number(id)))
    .filter(Boolean);
};

module.exports = {
  SCORE_PROJECTION,
  findMovieProjectionById,
  findMoviesByCategory,
  findMoviesByAffinitySeeds,
  buildCategoryCandidatePool,
  findMoviesByIdsPreserveOrder,
};
