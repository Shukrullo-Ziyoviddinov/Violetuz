'use strict';

/**
 * Identity for the extra profile-heat layer.
 * A profile is its kind plus the id stored on the collection.
 * The id keeps the type it arrived with: a string stays a string, a number stays a number.
 * `key` is only the row lookup. It marks that type so "1" and 1 stay different profiles.
 * Feed scoring does not use this module.
 */

const PROFILE_KINDS = Object.freeze(['artist', 'channel', 'actor']);

const kindSet = new Set(PROFILE_KINDS);
const keyPattern = new RegExp(`^(${PROFILE_KINDS.join('|')}):(s|n):([\\s\\S]+)$`);

/**
 * @param {unknown} kind
 * @returns {'artist'|'channel'|'actor'|null}
 */
const normalizeKind = (kind) => {
  if (typeof kind !== 'string') return null;
  const text = kind.trim().toLowerCase();
  return kindSet.has(text) ? text : null;
};

/**
 * @param {unknown} id
 * @returns {string|number|null}
 */
const normalizeId = (id) => {
  if (typeof id === 'number') {
    if (!Number.isSafeInteger(id)) return null;
    return id;
  }
  if (typeof id !== 'string') return null;
  const text = id.trim();
  return text || null;
};

/**
 * @param {unknown} kind
 * @param {unknown} id
 * @returns {{ kind: 'artist'|'channel'|'actor', id: string|number, key: string }|null}
 */
const profileRef = (kind, id) => {
  const normalizedKind = normalizeKind(kind);
  const normalizedId = normalizeId(id);
  if (!normalizedKind || normalizedId == null) return null;
  const mark = typeof normalizedId === 'number' ? 'n' : 's';
  return {
    kind: normalizedKind,
    id: normalizedId,
    key: `${normalizedKind}:${mark}:${normalizedId}`,
  };
};

/**
 * Artist id is the musicShorts.artistId value already read from the collection.
 * @param {unknown} artistId
 * @returns {{ kind: 'artist', id: string|number, key: string }|null}
 */
const artistProfileRef = (artistId) => profileRef('artist', artistId);

/**
 * @param {unknown} key
 * @returns {{ kind: 'artist'|'channel'|'actor', id: string|number, key: string }|null}
 */
const parseProfileRef = (key) => {
  if (typeof key !== 'string') return null;
  const match = keyPattern.exec(key);
  if (!match) return null;
  const kind = match[1];
  const mark = match[2];
  const raw = match[3];

  if (mark === 'n') {
    if (!/^-?(?:0|[1-9]\d*)$/.test(raw)) return null;
    const id = Number(raw);
    if (!Number.isSafeInteger(id) || String(id) !== raw) return null;
    return { kind, id, key: `${kind}:n:${id}` };
  }

  if (!raw || raw !== raw.trim()) return null;
  return { kind, id: raw, key: `${kind}:s:${raw}` };
};

module.exports = {
  PROFILE_KINDS,
  profileRef,
  artistProfileRef,
  parseProfileRef,
};
