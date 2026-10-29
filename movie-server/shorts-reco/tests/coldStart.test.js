'use strict';

const assert = require('node:assert/strict');
const { mixColdStart } = require('../services/coldStart.service');
const { createFeedService } = require('../services/feed/feed.service');
const { queryDocs } = require('../services/feed/sources/match');

const docs = [
  { shortId: 'movieShorts:1', type: 'movieShorts', movieId: 1, artistId: 'a', catalogAddedAt: '2026-02-01' },
  { shortId: 'movieShorts:2', type: 'movieShorts', movieId: 2, artistId: 'b', catalogAddedAt: '2026-01-01' },
  { shortId: 'musicshorts:3', type: 'musicshorts', movieId: null, artistId: 'c', catalogAddedAt: '2026-02-02' },
  { shortId: 'musicshorts:4', type: 'musicshorts', movieId: null, artistId: 'd', catalogAddedAt: '2026-01-02' },
];

const mixed = mixColdStart({
  docs,
  popularIds: ['musicshorts:4', 'movieShorts:1'],
  limit: 4,
  viewCount: 0,
});
assert.equal(mixed.length, 4);
for (let i = 1; i < mixed.length; i += 1) {
  assert.notEqual(mixed[i].type, mixed[i - 1].type);
}

const blended = mixColdStart({
  docs,
  popularIds: [],
  limit: 6,
  viewCount: 2,
  profileDocs: [{ shortId: 'movieShorts:99', type: 'movieShorts', movieId: 99, artistId: 'z' }],
});
assert.equal(blended[2].shortId, 'movieShorts:99');

const guestMix = mixColdStart({
  docs,
  popularIds: [],
  limit: 4,
  viewCount: 0,
  profileDocs: [{ shortId: 'movieShorts:99', type: 'movieShorts', movieId: 99, artistId: 'z' }],
});
assert.ok(guestMix.every((doc) => doc.shortId !== 'movieShorts:99'));

const main = async () => {
const saved = [];
const feed = createFeedService({
  catalogRepo: {
    async findMatching(filter, limit, sort) {
      return queryDocs(docs, filter, limit, sort);
    },
    async findActorsForMovies() {
      return new Map();
    },
  },
  watchRepo: {
    async listByUser() {
      return [];
    },
  },
  profileRepo: {
    async findByUserId() {
      return null;
    },
    async save() {
      throw new Error('guest profile must not be saved');
    },
  },
  statsRepo: {
    async listTop() {
      return [
        { shortId: 'musicshorts:4', views: 10 },
        { shortId: 'movieShorts:1', views: 9 },
      ];
    },
  },
  sessionRepo: {
    async findById() {
      return null;
    },
    async save(doc) {
      saved.push(doc);
    },
  },
});

const page = await feed.serveFeed({});
assert.ok(page.sessionId);
assert.equal(page.frozenUntil, 3);
assert.ok(page.items.length >= 2);
for (let i = 1; i < page.items.length; i += 1) {
  assert.notEqual(page.items[i].type, page.items[i - 1].type);
}
assert.equal(saved.length, 1);
assert.equal(saved[0].userId, null);

console.log('ok coldStart');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
