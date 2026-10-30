'use strict';

const assert = require('node:assert/strict');
const { composeSession, createFeedSessionService } = require('../services/feed/feedSession.service');

const item = (shortId) => ({
  shortId,
  slot: 'explore',
  anchorKey: null,
  type: 'movieShorts',
  contentType: null,
  movieId: 1,
  artistId: null,
  musicKey: `music:${shortId}`,
  repeat: false,
});

const main = async () => {
const now = new Date('2026-08-10T00:00:00.000Z');
const first = composeSession(null, 0, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(item), 'user-1', now);
assert.equal(first.items.length, 8);
assert.equal(first.frozenUntil, 3);
assert.deepEqual(first.items.map((row) => row.shortId), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);

const store = { doc: null };
const sessions = {
  async findById(id) {
    return store.doc && store.doc.sessionId === id ? store.doc : null;
  },
  async save(doc) {
    store.doc = doc;
  },
};
const service = createFeedSessionService(sessions, { now: () => now });
const opened = await service.serve({
  userId: 'user-1',
  position: 0,
  build: async () => ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(item),
});
assert.equal(opened.frozenUntil, 3);

const rebuilt = await service.serve({
  sessionId: opened.sessionId,
  userId: 'user-1',
  position: 0,
  build: async ({ exclude }) => ['a', 'b', 'c', 'd', 'Z', 'Y', 'X', 'W']
    .filter((id) => !exclude.has(id))
    .map(item),
});
assert.deepEqual(
  rebuilt.items.slice(0, 4).map((row) => row.shortId),
  opened.items.slice(0, 4).map((row) => row.shortId)
);
assert.equal(rebuilt.items[4].shortId, 'Z');
assert.equal(new Set(rebuilt.items.map((row) => row.shortId)).size, rebuilt.items.length);

const kept = rebuilt.items.slice(0, 6).map((row) => row.shortId);
const forward = await service.serve({
  sessionId: opened.sessionId,
  userId: 'user-1',
  position: 2,
  build: async ({ exclude }) => ['n1', 'n2', 'n3', 'n4']
    .filter((id) => !exclude.has(id))
    .map(item),
});
assert.deepEqual(forward.items.slice(0, 6).map((row) => row.shortId), kept);
assert.equal(forward.items[6].shortId, 'n1');
assert.equal(forward.frozenUntil, 5);
assert.equal(new Set(forward.items.map((row) => row.shortId)).size, forward.items.length);

const focusStore = { doc: null };
const focusSessions = {
  async findById(id) {
    return focusStore.doc && focusStore.doc.sessionId === id ? focusStore.doc : null;
  },
  async save(doc) {
    focusStore.doc = doc;
  },
};
const focused = await createFeedSessionService(focusSessions, { now: () => now }).serve({
  userId: 'user-1',
  position: 0,
  focusItem: item('c'),
  build: async () => ['a', 'b', 'c', 'd'].map(item),
});
assert.deepEqual(focused.items.map((row) => row.shortId), ['c', 'a', 'b', 'd']);

console.log('ok feedSession');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
