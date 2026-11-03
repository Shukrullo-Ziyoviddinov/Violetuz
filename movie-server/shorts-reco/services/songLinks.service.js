'use strict';

const config = require('../config');
const { musicKey, artistIdsOf } = require('../utils/keys');
const { normalizeTitle, titleToken } = require('../utils/normalize');

/**
 * Links music, klip and konsert versions of one song.
 * 1. music.clipId, clips.musicId and concerts.musicId when both documents exist.
 * 2. Otherwise the same artistId plus a normalized title.
 * Artist-only grouping runs only when config.songLinkArtistOnly is true.
 * A stored group always contains at least two different kinds.
 */

const musicKind = config.contentTypes[0];
const klipKind = config.contentTypes[1];
const concertKind = config.contentTypes[2];

/**
 * @param {Map<string, string>} parent
 * @param {string} key
 * @returns {string}
 */
const findRoot = (parent, key) => {
  let current = key;
  while (parent.get(current) !== current) {
    const next = parent.get(current);
    parent.set(current, parent.get(next));
    current = next;
  }
  return current;
};

/**
 * @param {Map<string, string>} parent
 * @param {string} left
 * @param {string} right
 * @returns {string}
 */
const unionKeys = (parent, left, right) => {
  const leftRoot = findRoot(parent, left);
  const rightRoot = findRoot(parent, right);
  if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot);
  return findRoot(parent, leftRoot);
};

/**
 * @param {Map<string, string>} parent
 * @param {Set<string>} explicitMembers
 * @param {string} key
 * @returns {boolean}
 */
const componentIsExplicit = (parent, explicitMembers, key) => {
  const root = findRoot(parent, key);
  for (const member of explicitMembers) {
    if (findRoot(parent, member) === root) return true;
  }
  return false;
};

/**
 * @param {object[]} members
 * @returns {string|null}
 */
const sharedArtistId = (members) => {
  let shared = null;
  for (let i = 0; i < members.length; i += 1) {
    const ids = artistIdsOf(members[i].artistId);
    if (!ids.length) return null;
    if (!shared) {
      shared = new Set(ids);
      continue;
    }
    const next = new Set(ids);
    for (const id of [...shared]) {
      if (!next.has(id)) shared.delete(id);
    }
    if (!shared.size) return null;
  }
  if (!shared || !shared.size) return null;
  const list = [...shared].sort();
  return list.length === 1 ? list[0] : list.join(',');
};

/**
 * @param {object[]} members
 * @param {string} method
 * @param {string|null} artistId
 * @returns {string}
 */
const songGroupIdFor = (members, method, artistId) => {
  if (method === config.songLinkMethods.catalogRef) {
    const musics = members
      .filter((member) => member.kind === musicKind)
      .sort((left, right) => left.id - right.id);
    if (musics.length > 0) return `song:music:${musics[0].id}`;
    return `song:ref:${members.map((member) => member.musicKey).sort().join('|')}`;
  }

  if (method === config.songLinkMethods.artistTitle) {
    return `song:title:${artistId}:${titleToken(members[0].title)}`;
  }

  return `song:artist:${artistId}`;
};

/**
 * @param {object[]} tracks
 * @param {{ songLinkArtistOnly?: boolean }} [options]
 * @returns {{ groups: object[], byMusicKey: Map<string, string> }}
 */
const buildSongGroups = (tracks, options = {}) => {
  const allowArtistOnly = options.songLinkArtistOnly === true;
  const methods = config.songLinkMethods;
  const parent = new Map();
  const explicitMembers = new Set();
  const byKey = new Map();

  for (let i = 0; i < tracks.length; i += 1) {
    const track = tracks[i];
    if (!track || track.id == null || !track.kind) continue;
    const key = musicKey(track.kind, track.id);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, track);
    parent.set(key, key);
  }

  const linkExplicit = (leftKind, leftId, rightKind, rightId) => {
    const left = musicKey(leftKind, leftId);
    const right = musicKey(rightKind, rightId);
    if (!left || !right || !parent.has(left) || !parent.has(right) || left === right) return;
    unionKeys(parent, left, right);
    explicitMembers.add(left);
    explicitMembers.add(right);
  };

  for (const track of byKey.values()) {
    if (track.kind === musicKind && track.clipId != null) {
      linkExplicit(musicKind, track.id, klipKind, track.clipId);
    }
    if (track.kind === klipKind && track.musicId != null) {
      linkExplicit(klipKind, track.id, musicKind, track.musicId);
    }
    if (track.kind === concertKind && track.musicId != null) {
      linkExplicit(concertKind, track.id, musicKind, track.musicId);
    }
  }

  const isExplicit = (track) =>
    componentIsExplicit(parent, explicitMembers, musicKey(track.kind, track.id));

  const titleBuckets = new Map();
  const artistBuckets = new Map();

  for (const track of byKey.values()) {
    if (isExplicit(track)) continue;
    const title = normalizeTitle(track.title);
    const artistIds = artistIdsOf(track.artistId);
    if (title && artistIds.length) {
      for (let i = 0; i < artistIds.length; i += 1) {
        const bucketKey = `${artistIds[i]}\0${title}`;
        const bucket = titleBuckets.get(bucketKey) || [];
        bucket.push(track);
        titleBuckets.set(bucketKey, bucket);
      }
    } else if (allowArtistOnly && !title && artistIds.length) {
      for (let i = 0; i < artistIds.length; i += 1) {
        const bucket = artistBuckets.get(artistIds[i]) || [];
        bucket.push(track);
        artistBuckets.set(artistIds[i], bucket);
      }
    }
  }

  /** @type {Map<string, string[]>} */
  const components = new Map();
  for (const key of byKey.keys()) {
    const root = findRoot(parent, key);
    const list = components.get(root) || [];
    list.push(key);
    components.set(root, list);
  }

  const groups = [];
  const byMusicKey = new Map();
  const kindRank = new Map(config.contentTypes.map((kind, index) => [kind, index]));

  const rememberGroup = (key, songGroupId) => {
    const current = byMusicKey.get(key);
    const list = !current ? [] : Array.isArray(current) ? current.slice() : [current];
    if (!list.includes(songGroupId)) list.push(songGroupId);
    list.sort();
    byMusicKey.set(key, list.length === 1 ? list[0] : list);
  };

  const publicMembersOf = (members) =>
    members
      .map((member) => ({ musicKey: member.musicKey, kind: member.kind }))
      .sort((left, right) => {
        const byKind = (kindRank.get(left.kind) ?? 9) - (kindRank.get(right.kind) ?? 9);
        if (byKind !== 0) return byKind;
        return left.musicKey < right.musicKey ? -1 : 1;
      });

  /**
   * One artist box stays one group. Boxes are not unioned, so a collab
   * track can sit in each artist's group without gluing those artists together.
   * @param {Map<string, object[]>} buckets
   * @param {string} method
   */
  const emitFreeBuckets = (buckets, method) => {
    const bucketKeys = [...buckets.keys()].sort();
    for (let b = 0; b < bucketKeys.length; b += 1) {
      const bucketKey = bucketKeys[b];
      const free = buckets.get(bucketKey).filter((track) => !isExplicit(track));
      const kinds = new Set(free.map((track) => track.kind));
      if (kinds.size < 2) continue;
      const artistId = method === methods.artistTitle
        ? bucketKey.slice(0, bucketKey.indexOf('\0'))
        : bucketKey;
      if (!artistId) continue;
      const members = free.map((track) => ({
        musicKey: musicKey(track.kind, track.id),
        kind: track.kind,
        id: track.id,
        artistId: track.artistId || null,
        title: track.title || '',
        explicit: false,
      }));
      const songGroupId = songGroupIdFor(members, method, artistId);
      const publicMembers = publicMembersOf(members);
      groups.push({ songGroupId, artistId, members: publicMembers, method });
      for (let i = 0; i < publicMembers.length; i += 1) {
        rememberGroup(publicMembers[i].musicKey, songGroupId);
      }
    }
  };

  for (const keys of components.values()) {
    const members = keys.map((key) => {
      const track = byKey.get(key);
      return {
        musicKey: key,
        kind: track.kind,
        id: track.id,
        artistId: track.artistId || null,
        title: track.title || '',
        explicit: explicitMembers.has(key),
      };
    });

    const kinds = new Set(members.map((member) => member.kind));
    if (kinds.size < 2) continue;

    const artistId = sharedArtistId(members);
    let method = methods.artistTitle;
    if (members.some((member) => member.explicit)) method = methods.catalogRef;
    else if (members.every((member) => !normalizeTitle(member.title))) method = methods.artistOnly;

    const songGroupId = songGroupIdFor(members, method, artistId);
    const publicMembers = publicMembersOf(members);

    groups.push({ songGroupId, artistId, members: publicMembers, method });
    for (let i = 0; i < publicMembers.length; i += 1) {
      rememberGroup(publicMembers[i].musicKey, songGroupId);
    }
  }

  emitFreeBuckets(titleBuckets, methods.artistTitle);
  if (allowArtistOnly) emitFreeBuckets(artistBuckets, methods.artistOnly);

  return { groups, byMusicKey };
};

/**
 * One id stays a string match. Several ids match any of them.
 * @param {string|string[]|null|undefined} songGroupId
 * @returns {string|{ $in: string[] }|null}
 */
const songGroupMatch = (songGroupId) => {
  if (Array.isArray(songGroupId)) {
    const ids = [];
    for (let i = 0; i < songGroupId.length; i += 1) {
      const id = songGroupId[i];
      if (typeof id === 'string' && id && !ids.includes(id)) ids.push(id);
    }
    if (!ids.length) return null;
    return { $in: ids };
  }
  if (typeof songGroupId !== 'string' || !songGroupId) return null;
  return songGroupId;
};

/**
 * Single lookup used by catalog sync. Replace this function if the link rule changes.
 * @param {Map<string, string>|Record<string, string>|null|undefined} byMusicKey
 * @param {string|null|undefined} key
 * @returns {string|null}
 */
const resolveSongGroup = (byMusicKey, key) => {
  if (!key || !byMusicKey) return null;
  if (typeof byMusicKey.get === 'function') return byMusicKey.get(key) || null;
  return byMusicKey[key] || null;
};

module.exports = {
  buildSongGroups,
  resolveSongGroup,
  songGroupMatch,
};
