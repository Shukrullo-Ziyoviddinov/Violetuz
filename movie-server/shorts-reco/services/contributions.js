'use strict';

const config = require('../config');
const collections = require('../config/collections');
const {
  movieProfileKey,
  musicProfileKey,
  artistProfileKey,
  genreProfileKey,
  musicGenreProfileKey,
  countryProfileKey,
  typeProfileKey,
} = require('../utils/keys');

const BUCKETS = [
  'movies',
  'musicKeys',
  'artists',
  'genres',
  'musicGenres',
  'countries',
  'types',
  'movieEngagementRaw',
  'actorPenalty',
];

const movieShortType = collections.existing.shortsVideos.type;
const musicShortType = collections.existing.musicShorts.type;

const emptyLongTerm = () => ({
  movies: {},
  musicKeys: {},
  artists: {},
  genres: {},
  musicGenres: {},
  countries: {},
  types: {},
  movieEngagementRaw: {},
  actorPenalty: {},
});

/**
 * Negative scores are halved on movie, music and artist keys only.
 * @param {number} score
 * @param {string} kind
 * @returns {number}
 */
const effectiveScore = (score, kind) => {
  if (!(score < 0)) return score;
  if (kind === 'movie' || kind === 'music' || kind === 'artist') {
    return score * config.skipPenaltyFactor;
  }
  return score;
};

/**
 * @param {unknown[]} values
 * @param {number} share
 * @param {(value: unknown) => string|null} toKey
 * @param {string} bucket
 * @param {string} kind
 */
const equalPortions = (values, share, toKey, bucket, kind) => {
  const list = (values || []).filter((value) => value != null && value !== '');
  if (list.length === 0 || !share) return [];
  const portion = share / list.length;
  const out = [];
  for (let i = 0; i < list.length; i += 1) {
    const key = toKey(list[i]);
    if (key) out.push({ bucket, key, portion, kind });
  }
  return out;
};

/**
 * filterGenre weight 1, typeCategory weight typeCategoryWeight, one genre pool.
 * @param {string[]} genres
 * @param {string[]} typeCategories
 */
const genrePortions = (genres, typeCategories) => {
  /** @type {Map<string, number>} */
  const weights = new Map();
  const add = (raw, weight) => {
    const key = genreProfileKey(raw);
    if (!key) return;
    weights.set(key, (weights.get(key) || 0) + weight);
  };
  (genres || []).forEach((genre) => add(genre, 1));
  (typeCategories || []).forEach((genre) => add(genre, config.typeCategoryWeight));

  let total = 0;
  weights.forEach((weight) => {
    total += weight;
  });
  if (total <= 0) return [];

  const share = config.shares.movieShorts.movieGenre;
  const out = [];
  weights.forEach((weight, key) => {
    out.push({
      bucket: 'genres',
      key,
      portion: share * (weight / total),
      kind: 'genre',
    });
  });
  return out;
};

/**
 * Franchise movies are not written here. They are applied at ranking time.
 * @param {object} catalog
 * @returns {object[]}
 */
const portionsOf = (catalog) => {
  if (!catalog || !catalog.type) return [];
  const parts = [];

  if (catalog.type === movieShortType) {
    const share = config.shares.movieShorts;
    if (catalog.movieId != null) {
      parts.push({
        bucket: 'movies',
        key: movieProfileKey(catalog.movieId),
        portion: share.movie,
        kind: 'movie',
      });
    }
    if (catalog.musicKey) {
      parts.push({
        bucket: 'musicKeys',
        key: musicProfileKey(catalog.musicKey),
        portion: share.musicKey,
        kind: 'music',
      });
    }
    parts.push({
      bucket: 'types',
      key: typeProfileKey(catalog.type),
      portion: share.type,
      kind: 'type',
    });
    if (catalog.artistId) {
      parts.push({
        bucket: 'artists',
        key: artistProfileKey(catalog.artistId),
        portion: share.artist,
        kind: 'artist',
      });
    }
    parts.push(...genrePortions(catalog.movieGenres, catalog.movieTypeCategories));
    parts.push(
      ...equalPortions(catalog.movieCountries, share.country, countryProfileKey, 'countries', 'country')
    );
    parts.push(
      ...equalPortions(
        catalog.musicGenres,
        share.musicGenre,
        musicGenreProfileKey,
        'musicGenres',
        'musicGenre'
      )
    );
    parts.push(
      ...equalPortions(
        catalog.musicCountries,
        share.musicCountry,
        countryProfileKey,
        'countries',
        'country'
      )
    );
    return parts.filter((part) => part.key);
  }

  if (catalog.type === musicShortType) {
    const share = config.shares.musicshorts;
    if (catalog.artistId) {
      parts.push({
        bucket: 'artists',
        key: artistProfileKey(catalog.artistId),
        portion: share.artist,
        kind: 'artist',
      });
    }
    if (catalog.musicKey) {
      parts.push({
        bucket: 'musicKeys',
        key: musicProfileKey(catalog.musicKey),
        portion: share.musicKey,
        kind: 'music',
      });
    }
    parts.push({
      bucket: 'types',
      key: typeProfileKey(catalog.type),
      portion: share.type,
      kind: 'type',
    });
    parts.push(
      ...equalPortions(
        catalog.musicGenres,
        share.musicGenre,
        musicGenreProfileKey,
        'musicGenres',
        'musicGenre'
      )
    );
    parts.push(
      ...equalPortions(
        catalog.musicCountries,
        share.country,
        countryProfileKey,
        'countries',
        'country'
      )
    );
    if (catalog.movieId != null) {
      parts.push({
        bucket: 'movies',
        key: movieProfileKey(catalog.movieId),
        portion: share.linkedMovie,
        kind: 'movie',
      });
    }
  }

  return parts.filter((part) => part.key);
};

module.exports = {
  BUCKETS,
  emptyLongTerm,
  effectiveScore,
  portionsOf,
};
