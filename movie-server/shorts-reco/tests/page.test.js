'use strict';

const assert = require('node:assert/strict');
const { createShelfService } = require('../services/shelf.service');
const { emptyProfile } = require('../services/profile.service');

const now = new Date('2026-10-30T12:00:00.000Z');
const day = 24 * 60 * 60 * 1000;

const movie = (id, movieId) => ({
  shortId: `movieShorts:${id}`,
  type: 'movieShorts',
  movieId,
  artistId: `artist-${movieId}`,
  catalogAddedAt: now,
});

const docs = [
  movie(1, 1),
  movie(2, 8),
  movie(3, 3),
  movie(4, 8),
  movie(5, 8),
  movie(6, 9),
];

const profile = emptyProfile('user-1', now);
profile.longTerm.movies['m:8'] = 40;

const watches = [
  { shortId: 'movieShorts:90', lastSeenAt: now },
  { shortId: 'movieShorts:91', lastSeenAt: now },
  { shortId: 'movieShorts:92', lastSeenAt: now },
  { shortId: 'movieShorts:4', lastSeenAt: new Date(now.getTime() - day) },
  { shortId: 'movieShorts:5', lastSeenAt: new Date(now.getTime() - 5 * day) },
  { shortId: 'movieShorts:6', lastSeenAt: new Date(now.getTime() - 5 * day) },
];

const page = createShelfService({
  catalogRepo: {
    async findMatching() {
      return docs;
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
  const personal = await page.servePage({ userId: 'user-1', now });
  const ids = personal.items.map((item) => item.shortId);
  assert.equal(ids.includes('movieShorts:4'), false);
  assert.equal(ids[0], 'movieShorts:2');

  const unseen = ['movieShorts:1', 'movieShorts:2', 'movieShorts:3'];
  const repeats = ['movieShorts:5', 'movieShorts:6'];
  const lastUnseen = Math.max(...unseen.map((id) => ids.indexOf(id)));
  const firstRepeat = Math.min(...repeats.map((id) => ids.indexOf(id)));
  assert.ok(lastUnseen < firstRepeat);
  assert.ok(ids.indexOf('movieShorts:5') < ids.indexOf('movieShorts:6'));
  assert.deepEqual(ids.slice(lastUnseen + 1), repeats);

  console.log('ok page');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
