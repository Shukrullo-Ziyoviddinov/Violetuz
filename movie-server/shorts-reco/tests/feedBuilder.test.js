'use strict';

const assert = require('node:assert/strict');
const { accepts } = require('../services/feed/diversity');
const { buildFeed } = require('../services/feed/feedBuilder');
const { queryDocs } = require('../services/feed/sources/match');

const picked = [];
for (let i = 0; i < 3; i += 1) {
  picked.push({ movieId: 1, artistId: `a${i}`, musicKey: `k${i}` });
  picked.push({ movieId: 2, artistId: `b${i}`, musicKey: `n${i}` });
}
assert.equal(accepts(picked, { movieId: 1, artistId: 'z', musicKey: 'z' }), false);
assert.equal(accepts(picked, { movieId: 3, artistId: 'z', musicKey: 'z' }), true);

const artists = [];
for (let i = 0; i < 3; i += 1) {
  artists.push({ movieId: i + 1, artistId: 'same', musicKey: `s${i}` });
  artists.push({ movieId: i + 10, artistId: `other${i}`, musicKey: `o${i}` });
}
assert.equal(accepts(artists, { movieId: 9, artistId: 'same', musicKey: 'new' }), false);
assert.equal(accepts(
  [{ musicKey: 'music:1', artistId: 'a', movieId: 1 }],
  { musicKey: 'music:1', artistId: 'b', movieId: 2 }
), false);
assert.equal(accepts(
  [{ artistId: 'a', musicKey: 'm1', movieId: 1 }],
  { artistId: 'a', musicKey: 'm2', movieId: 2 }
), false);

const run = pickedSoFar => accepts(
  pickedSoFar,
  { movieId: 7, artistId: 'fresh', musicKey: 'music:7' }
);
assert.equal(run([{ movieId: 7, artistId: 'one', musicKey: 'music:1' }]), true);
assert.equal(run([
  { movieId: 7, artistId: 'one', musicKey: 'music:1' },
  { movieId: 7, artistId: 'two', musicKey: 'music:2' },
]), false);

const main = async () => {
const catalog = [0, 1, 2, 3, 4].map((id) => ({
  shortId: `movieShorts:${id}`,
  type: 'movieShorts',
  movieId: 1,
  artistId: `artist-${id}`,
  musicKey: `music:${id}`,
}));

const consecutive = await buildFeed({
  slots: Array.from({ length: 6 }, () => ({ source: 'sameMovie' })),
  anchor: { key: 'm:1', kind: 'movie', type: 'movieShorts', movieId: 1 },
  topAnchorKeys: ['m:1'],
  query: (filter, limit, sort) => queryDocs(catalog, filter, limit, sort),
  now: new Date('2026-08-10T00:00:00.000Z'),
});
assert.equal(consecutive.length, 2);
assert.notEqual(consecutive[0].shortId, consecutive[1].shortId);

const day = 24 * 60 * 60 * 1000;
const now = new Date('2026-08-10T00:00:00.000Z');
const watched = [
  {
    shortId: 'movieShorts:blocked',
    type: 'movieShorts',
    movieId: 9,
    artistId: 'a',
    musicKey: 'music:1',
  },
  {
    shortId: 'movieShorts:old',
    type: 'movieShorts',
    movieId: 9,
    artistId: 'b',
    musicKey: 'music:2',
  },
];
const watches = new Map([
  ['movieShorts:blocked', { lastSeenAt: new Date(now.getTime() - day), liked: false, commented: false }],
  ['movieShorts:old', { lastSeenAt: new Date(now.getTime() - 8 * day), liked: false, commented: false }],
]);
const query = (filter, limit, sort) => queryDocs(watched, filter, limit, sort);
const anchor = { key: 'm:9', kind: 'movie', type: 'movieShorts', movieId: 9 };

const forced = await buildFeed({
  slots: [{ source: 'sameMovie' }],
  anchor,
  topAnchorKeys: [],
  watches,
  query,
  now,
});
assert.equal(forced.length, 0);

const repeated = await buildFeed({
  slots: [{ source: 'sameMovie' }],
  anchor,
  topAnchorKeys: ['m:9'],
  watches,
  query,
  now,
});
assert.equal(repeated.length, 1);
assert.equal(repeated[0].shortId, 'movieShorts:old');
assert.equal(repeated[0].repeat, true);

const withUnseen = await buildFeed({
  slots: [{ source: 'sameMovie' }],
  anchor,
  topAnchorKeys: ['m:9'],
  watches,
  query: (filter, limit, sort) => queryDocs(watched.concat([{
    shortId: 'movieShorts:new',
    type: 'movieShorts',
    movieId: 9,
    artistId: 'c',
    musicKey: 'music:3',
  }]), filter, limit, sort),
  now,
});
assert.equal(withUnseen[0].shortId, 'movieShorts:new');
assert.equal(withUnseen[0].repeat, false);

const errors = [];
const empty = await buildFeed({
  slots: [{ source: 'sameMovie' }, { source: 'explore' }],
  anchor,
  topAnchorKeys: ['m:9'],
  query: async () => {
    throw new Error('source down');
  },
  logger: { error(message) { errors.push(message); } },
  now,
});
assert.deepEqual(empty, []);
assert.ok(errors.length >= 1);

const fallback = await buildFeed({
  slots: [{ source: 'sameArtist', mode: 'fromMovie' }],
  anchor: {
    key: 'm:1',
    kind: 'movie',
    type: 'movieShorts',
    movieId: 1,
    artistId: null,
    movieGenres: ['drama'],
    movieCountries: [],
  },
  topAnchorKeys: ['m:1'],
  query: (filter, limit, sort) => queryDocs([{
    shortId: 'movieShorts:2',
    type: 'movieShorts',
    movieId: 2,
    artistId: 'x',
    musicKey: 'music:9',
    movieGenres: ['drama'],
    movieCountries: [],
  }], filter, limit, sort),
  now,
});
assert.equal(fallback.length, 1);
assert.equal(fallback[0].slot, 'similar');

console.log('ok feedBuilder');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
