'use strict';

/**
 * Genre and country values may be a string or an array.
 * Results are trimmed, lowercased, deduped. Objects are ignored.
 * Movie countries come from filterCountry only. Music countries are not
 * translated onto the movie vocabulary.
 */

/**
 * @param {unknown} value
 * @returns {string[]}
 */
const toKeyList = (value) => {
  const list = Array.isArray(value) ? value : value == null ? [] : [value];
  const out = [];
  const seen = new Set();

  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    if (typeof item !== 'string' && typeof item !== 'number') continue;
    const key = String(item).trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }

  return out;
};

/**
 * @param {string[][]} groups
 * @returns {string[]}
 */
const unionKeys = (...groups) => {
  const out = [];
  const seen = new Set();

  for (let i = 0; i < groups.length; i += 1) {
    const group = groups[i] || [];
    for (let j = 0; j < group.length; j += 1) {
      const key = group[j];
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
  }

  return out;
};

/**
 * filterGenre only. typeCategory is a separate, lower-weight helper.
 * @param {{ filterGenre?: unknown }|null|undefined} movie
 * @returns {string[]}
 */
const genreKeysOfMovie = (movie) => toKeyList(movie && movie.filterGenre);

/**
 * @param {{ typeCategory?: unknown }|null|undefined} movie
 * @returns {string[]}
 */
const typeCategoryKeysOfMovie = (movie) => toKeyList(movie && movie.typeCategory);

/**
 * filterCountry only. specs.countries is never read.
 * @param {{ filterCountry?: unknown }|null|undefined} movie
 * @returns {string[]}
 */
const countryKeysOfMovie = (movie) => toKeyList(movie && movie.filterCountry);

/**
 * @param {{ genre?: unknown }|null|undefined} doc
 * @returns {string[]}
 */
const genreKeysOfMusic = (doc) => toKeyList(doc && doc.genre);

/**
 * @param {{ country?: unknown }|null|undefined} doc
 * @returns {string[]}
 */
const countryKeysOfMusic = (doc) => toKeyList(doc && doc.country);

/**
 * @param {unknown} title
 * @returns {string}
 */
const normalizeTitle = (title) => {
  if (typeof title !== 'string' && typeof title !== 'number') return '';
  return String(title).trim().toLowerCase().replace(/\s+/g, ' ');
};

/**
 * Stable token for a song-group id. Keeps letters outside a-z (Cyrillic included).
 * @param {unknown} title
 * @returns {string}
 */
const titleToken = (title) =>
  normalizeTitle(title)
    .replace(/[.$:]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');

module.exports = {
  toKeyList,
  unionKeys,
  genreKeysOfMovie,
  typeCategoryKeysOfMovie,
  countryKeysOfMovie,
  genreKeysOfMusic,
  countryKeysOfMusic,
  normalizeTitle,
  titleToken,
};
