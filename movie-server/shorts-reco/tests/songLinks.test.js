'use strict';

const assert = require('node:assert/strict');
const { buildSongGroups, resolveSongGroup } = require('../services/songLinks.service');

const groupWith = (groups, key) =>
  groups.find((group) => group.members.some((member) => member.musicKey === key));

const explicit = buildSongGroups([
  { kind: 'music', id: 10, artistId: 'b', title: 'Live', clipId: null, musicId: null },
  { kind: 'klip', id: 11, artistId: 'b', title: 'Other', musicId: 10, clipId: null },
  { kind: 'konsert', id: 12, artistId: 'other', title: 'Live Show', musicId: 10, clipId: null },
]);

const linked = groupWith(explicit.groups, 'music:10');
assert.equal(explicit.groups.length, 1);
assert.equal(linked.songGroupId, 'song:music:10');
assert.equal(linked.method, 'catalogRef');
assert.equal(linked.artistId, null);
assert.deepEqual(
  linked.members.map((member) => member.musicKey),
  ['music:10', 'klip:11', 'konsert:12']
);
assert.equal(explicit.byMusicKey.get('klip:11'), 'song:music:10');
assert.equal(linked.members[0].title, undefined);

const separated = buildSongGroups([
  { kind: 'music', id: 1, artistId: 'a', title: 'Same', clipId: 2 },
  { kind: 'klip', id: 2, artistId: 'a', title: 'Same', musicId: 1 },
  { kind: 'music', id: 3, artistId: 'a', title: 'Same' },
  { kind: 'klip', id: 4, artistId: 'a', title: 'Same' },
]);
assert.equal(separated.groups.length, 2);
assert.equal(groupWith(separated.groups, 'music:1').method, 'catalogRef');
assert.equal(groupWith(separated.groups, 'music:1').songGroupId, 'song:music:1');
assert.equal(groupWith(separated.groups, 'music:3').method, 'artistTitle');
assert.equal(groupWith(separated.groups, 'music:3').songGroupId, 'song:title:a:same');
assert.equal(separated.byMusicKey.get('music:3'), separated.byMusicKey.get('klip:4'));
assert.notEqual(separated.byMusicKey.get('music:1'), separated.byMusicKey.get('music:3'));

const unresolved = buildSongGroups([
  { kind: 'music', id: 9, artistId: 'c', title: 'Solo' },
  { kind: 'music', id: 8, artistId: 'c', title: 'Solo' },
  { kind: 'klip', id: 7, artistId: 'd', title: 'Solo' },
  { kind: 'music', id: 6, artistId: 'c', title: 'Other', clipId: 999 },
]);
assert.equal(unresolved.groups.length, 0);
assert.equal(resolveSongGroup(unresolved.byMusicKey, 'music:9'), null);
assert.equal(resolveSongGroup(unresolved.byMusicKey, null), null);

const untitled = buildSongGroups(
  [
    { kind: 'music', id: 1, artistId: 'a', title: '' },
    { kind: 'klip', id: 2, artistId: 'a', title: '  ' },
  ],
  { songLinkArtistOnly: false }
);
assert.equal(untitled.groups.length, 0);

const artistOnly = buildSongGroups(
  [
    { kind: 'music', id: 1, artistId: 'a', title: '' },
    { kind: 'konsert', id: 2, artistId: 'a', title: '' },
  ],
  { songLinkArtistOnly: true }
);
assert.equal(artistOnly.groups.length, 1);
assert.equal(artistOnly.groups[0].method, 'artistOnly');
assert.equal(artistOnly.groups[0].songGroupId, 'song:artist:a');

console.log('ok songLinks');
