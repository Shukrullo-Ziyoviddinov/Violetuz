'use strict';

const assert = require('node:assert/strict');
const { createShelfService } = require('../services/shelf.service');
const { validateShelfQuery } = require('../validators/shelf.validator');
const { emptyProfile } = require('../services/profile.service');

const now = new Date('2026-10-30T12:00:00.000Z');

const movie = (id, movieId) => ({
  shortId: `movieShorts:${id}`,
  type: 'movieShorts',
  movieId,
  artistId: `artist-${movieId}`,
  catalogAddedAt: now,
});

const music = (id, artistId) => ({
  shortId: `musicshorts:${id}`,
  type: 'musicshorts',
  artistId,
  movieId: null,
  catalogAddedAt: now,
});

const docs = [
  movie(1, 1),
  movie(2, 8),
  movie(3, 3),
  music(10001, 'jah-khalib'),
];

const watches = [
  { shortId: 'movieShorts:90', lastSeenAt: now },
  { shortId: 'movieShorts:91', lastSeenAt: now },
  { shortId: 'movieShorts:92', lastSeenAt: now },
];

const profile = emptyProfile('user-1', now);
profile.longTerm.movies['m:8'] = 40;

const shelf = createShelfService({
  catalogRepo: {
    async findMatching(filter) {
      return docs.filter((doc) => doc.type === filter.type);
    },
  },
  watchRepo: {
    async listByUser() {
      return watches;
    },
  },
  profileRepo: {
    async findByUserId() {
      return profile;
    },
  },
  statsRepo: {
    async listTop() {
      return [];
    },
  },
});

const main = async () => {
  const invalid = validateShelfQuery({ type: 'clips' });
  assert.equal(invalid.ok, false);

  const guest = await shelf.serveShelf({ type: 'movieShorts', block: 0, limit: 10, now });
  assert.deepEqual(guest.items.map((item) => item.shortId), [
    'movieShorts:1',
    'movieShorts:2',
    'movieShorts:3',
  ]);
  assert.equal(guest.items.some((item) => item.type === 'musicshorts'), false);

  const personal = await shelf.serveShelf({
    userId: 'user-1',
    type: 'movieShorts',
    block: 0,
    limit: 1,
    now,
  });
  assert.equal(personal.items[0].shortId, 'movieShorts:2');
  assert.equal(personal.items[0].id, 2);

  const second = await shelf.serveShelf({
    userId: 'user-1',
    type: 'movieShorts',
    block: 1,
    limit: 1,
    now,
  });
  assert.equal(second.items[0].shortId, 'movieShorts:1');
  assert.notEqual(second.items[0].shortId, personal.items[0].shortId);

  const seen = createShelfService({
    catalogRepo: {
      async findMatching() {
        return [movie(1, 1), movie(2, 8), movie(3, 3)];
      },
    },
    watchRepo: {
      async listByUser() {
        return watches.concat([
          { shortId: 'movieShorts:2', lastSeenAt: now },
          { shortId: 'movieShorts:3', lastSeenAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        ]);
      },
    },
    profileRepo: {
      async findByUserId() {
        return profile;
      },
    },
    statsRepo: {
      async listTop() {
        return [];
      },
    },
  });
  const hidden = await seen.serveShelf({
    userId: 'user-1',
    type: 'movieShorts',
    block: 0,
    limit: 10,
    now,
  });
  assert.equal(hidden.items.some((item) => item.shortId === 'movieShorts:2'), false);
  assert.equal(hidden.items.some((item) => item.shortId === 'movieShorts:3'), false);
  assert.equal(hidden.items[0].shortId, 'movieShorts:1');

  console.log('ok shelf');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
