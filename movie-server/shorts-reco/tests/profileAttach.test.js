'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { appendProfileHeat } = require('../services/profileHeat/attach');
const { createFeedService } = require('../services/feed/feed.service');
const { queryDocs } = require('../services/feed/sources/match');

const shelfSource = fs.readFileSync(
  path.join(__dirname, '../services/shelf.service.js'),
  'utf8'
);
const builderSource = fs.readFileSync(
  path.join(__dirname, '../services/feed/feedBuilder.js'),
  'utf8'
);
assert.equal(shelfSource.includes('profileHeat'), false);
assert.equal(builderSource.includes('appendProfileHeat'), false);

const ids = (items) => (items || []).map((item) => item.shortId);

const docs = [
  { shortId: 'movieShorts:1', type: 'movieShorts', movieId: 1, artistId: 'a', catalogAddedAt: '2026-02-01' },
  { shortId: 'movieShorts:2', type: 'movieShorts', movieId: 2, artistId: 'b', catalogAddedAt: '2026-01-01' },
  { shortId: 'musicshorts:3', type: 'musicshorts', movieId: null, artistId: 'c', catalogAddedAt: '2026-02-02' },
  { shortId: 'musicshorts:4', type: 'musicshorts', movieId: null, artistId: 'd', catalogAddedAt: '2026-01-02' },
];

const extra = {
  shortId: 'musicshorts:90',
  type: 'musicshorts',
  artistId: 'jah-khalib',
  musicKey: null,
  movieId: null,
  contentType: 'music',
};

const repos = () => ({
  catalogRepo: {
    async findMatching(filter, limit, sort) {
      return queryDocs(docs, filter, limit, sort);
    },
    async findByClientShortId() {
      return null;
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
      return [];
    },
  },
  sessionRepo: {
    saved: null,
    async findById(id) {
      return this.saved && this.saved.sessionId === id ? this.saved : null;
    },
    async save(doc) {
      this.saved = doc;
    },
  },
});

const run = async () => {
  const kept = [{ shortId: 'movieShorts:1', slot: 'explore' }];
  const same = await appendProfileHeat(kept, {
    select: async () => [],
  });
  assert.equal(same, kept);

  const failed = await appendProfileHeat(kept, {
    select: async () => {
      throw new Error('share down');
    },
    logger: { error() {} },
  });
  assert.equal(failed, kept);

  const added = await appendProfileHeat(kept, {
    select: async () => [extra, { shortId: 'movieShorts:1' }],
  });
  assert.deepEqual(ids(added), ['movieShorts:1', 'musicshorts:90']);
  assert.equal(added[1].slot, 'profileHeat');

  const plainRepos = repos();
  const plain = await createFeedService(plainRepos).serveFeed({});
  const emptyRepos = repos();
  const empty = await createFeedService({
    ...emptyRepos,
    profileSlice: {
      async selectForUser() {
        return [];
      },
    },
  }).serveFeed({});
  assert.deepEqual(ids(empty.items), ids(plain.items));

  let failures = 0;
  const brokenRepos = repos();
  const broken = await createFeedService({
    ...brokenRepos,
    logger: {
      error() {
        failures += 1;
      },
    },
    profileSlice: {
      async selectForUser() {
        throw new Error('share down');
      },
    },
  }).serveFeed({});
  assert.deepEqual(ids(broken.items), ids(plain.items));
  assert.equal(failures, 1);

  const duplicateRepos = repos();
  const duplicate = await createFeedService({
    ...duplicateRepos,
    profileSlice: {
      async selectForUser() {
        return [{ shortId: plain.items[0].shortId, type: 'movieShorts' }];
      },
    },
  }).serveFeed({});
  assert.deepEqual(ids(duplicate.items), ids(plain.items));
  assert.equal(new Set(ids(duplicate.items)).size, duplicate.items.length);

  const session = repos();
  const feed = createFeedService({
    ...session,
    profileSlice: {
      async selectForUser(input) {
        assert.equal(input.exclude.has(plain.items[0].shortId), true);
        return [extra];
      },
    },
  });
  const first = await feed.serveFeed({});
  assert.equal(first.items[first.items.length - 1].shortId, 'musicshorts:90');
  assert.equal(first.frozenUntil, 3);
  assert.deepEqual(ids(first.items).slice(0, -1), ids(plain.items));
  const head = ids(first.items).slice(0, 4);
  const second = await feed.serveFeed({ sessionId: first.sessionId, position: 0 });
  assert.deepEqual(ids(second.items).slice(0, 4), head);
  assert.equal(new Set(ids(second.items)).size, second.items.length);

  console.log('ok profileAttach');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
