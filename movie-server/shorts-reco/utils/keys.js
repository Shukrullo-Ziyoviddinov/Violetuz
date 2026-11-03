'use strict';

/**
 * Catalog shortId is `${type}:${numericId}` so movieShorts and musicshorts
 * stay unique even if their numeric ranges ever overlap.
 * Profile map keys replace "." and "$" because MongoDB rejects them.
 */

/**
 * @param {unknown} value
 * @returns {number|null}
 */
const toFiniteNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
};

/**
 * @param {unknown} value
 * @returns {string|null}
 */
const blankToNull = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  return text ? text : null;
};

/**
 * @param {unknown} value
 * @returns {string}
 */
const sanitizeKeyPart = (value) => String(value).replace(/[.$]/g, '_');

/**
 * @param {string} type
 * @param {unknown} numericId
 * @returns {string|null}
 */
const shortCatalogId = (type, numericId) => {
  const id = toFiniteNumber(numericId);
  if (!type || id == null) return null;
  return `${type}:${id}`;
};

/**
 * @param {unknown} shortId
 * @returns {{ type: string, numericId: number }|null}
 */
const parseShortCatalogId = (shortId) => {
  if (typeof shortId !== 'string') return null;
  const splitAt = shortId.indexOf(':');
  if (splitAt <= 0) return null;
  const numericId = toFiniteNumber(shortId.slice(splitAt + 1));
  if (numericId == null) return null;
  return { type: shortId.slice(0, splitAt), numericId };
};

/**
 * @param {string|null|undefined} kind
 * @param {unknown} id
 * @returns {string|null}
 */
const musicKey = (kind, id) => {
  const numericId = toFiniteNumber(id);
  if (!kind || numericId == null) return null;
  return `${kind}:${numericId}`;
};

/**
 * @param {unknown} value
 * @returns {{ kind: string, id: number }|null}
 */
const parseMusicKey = (value) => {
  if (typeof value !== 'string') return null;
  const splitAt = value.indexOf(':');
  if (splitAt <= 0) return null;
  const id = toFiniteNumber(value.slice(splitAt + 1));
  if (id == null) return null;
  return { kind: value.slice(0, splitAt), id };
};

/**
 * @param {string} prefix
 * @param {unknown} value
 * @returns {string|null}
 */
const profileKey = (prefix, value) => {
  if (value == null || value === '' || typeof value === 'object') return null;
  const part = sanitizeKeyPart(value).trim();
  if (!part) return null;
  return `${prefix}:${part}`;
};

const movieProfileKey = (id) => profileKey('m', id);
const musicProfileKey = (key) => profileKey('mk', key);
const artistProfileKey = (id) => profileKey('a', id);
const genreProfileKey = (genre) => profileKey('g', genre);
const musicGenreProfileKey = (genre) => profileKey('mg', genre);
const countryProfileKey = (country) => profileKey('c', country);
const typeProfileKey = (type) => profileKey('t', type);
const actorProfileKey = (id) => profileKey('ac', id);

/**
 * Numeric ids stay numbers. Integer strings become numbers. Other strings stay strings.
 * @param {unknown} value
 * @returns {Array<number|string>}
 */
/**
 * Bitta id yoki massiv. Har bir artist id alohida.
 * @param {unknown} value
 * @returns {string[]}
 */
const artistIdsOf = (value) => {
  if (value == null || value === '') return [];
  const list = Array.isArray(value) ? value : [value];
  const seen = new Set();
  const out = [];
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    if (item == null || item === '' || typeof item === 'object') continue;
    const id = String(item).trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
};

/**
 * Bitta id satr bo‘lib qoladi. Bir nechtasi massiv.
 * @param {unknown} value
 * @returns {string|string[]|null}
 */
const storedArtistId = (value) => {
  const ids = artistIdsOf(value);
  if (!ids.length) return null;
  if (ids.length === 1) return ids[0];
  return ids;
};

/**
 * @param {unknown} left
 * @param {unknown} right
 * @returns {boolean}
 */
const sharesArtist = (left, right) => {
  const ids = artistIdsOf(left);
  if (!ids.length) return false;
  const other = new Set(artistIdsOf(right));
  return ids.some((id) => other.has(id));
};

const uniqueIds = (value) => {
  const list = Array.isArray(value) ? value : value == null ? [] : [value];
  const out = [];
  const seen = new Set();

  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    if (item == null || item === '' || typeof item === 'object') continue;

    let stored = null;
    if (typeof item === 'number' && Number.isFinite(item)) {
      stored = item;
    } else if (typeof item === 'string' && /^-?\d+$/.test(item.trim())) {
      stored = Number(item.trim());
    } else {
      const text = String(item).trim();
      stored = text || null;
    }

    if (stored == null) continue;
    const dedupeKey = String(stored);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    out.push(stored);
  }

  return out;
};

module.exports = {
  toFiniteNumber,
  blankToNull,
  sanitizeKeyPart,
  shortCatalogId,
  parseShortCatalogId,
  musicKey,
  parseMusicKey,
  profileKey,
  movieProfileKey,
  musicProfileKey,
  artistProfileKey,
  genreProfileKey,
  musicGenreProfileKey,
  countryProfileKey,
  typeProfileKey,
  actorProfileKey,
  artistIdsOf,
  storedArtistId,
  sharesArtist,
  uniqueIds,
};
