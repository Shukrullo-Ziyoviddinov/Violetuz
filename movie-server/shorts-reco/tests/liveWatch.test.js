'use strict';

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { shortScore } = require('../services/scoring.service');
const { applyWatch } = require('../services/aggregate');
const { pushSession } = require('../services/profile.service');
const { fatigueRows } = require('../services/feed/feed.service');
const { createFeedSessionService } = require('../services/feed/feedSession.service');
const { createWatchEventService } = require('../services/watchEvent.service');
const config = require('../config');

const viewId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const body = (overrides) => ({
  eventId: randomUUID(),
  shortId: 1,
  passRatio: 0.05,
  playedMsDelta: 5000,
  viewId,
  seq: 1,
  final: false,
  ts: '2026-10-30T12:00:00.000Z',
  ...overrides,
});

const createMemory = () => {
  const events = new Set();
  const watches = new Map();
  const profiles = new Map();
  return {
    watches,
    profiles,
    catalogRepo: {
      async findByClientShortId() {
        return {
          shortId: 'movieShorts:1',
          type: 'movieShorts',
          movieId: 4,
          movieGenres: ['jangari'],
          movieTypeCategories: [],
          movieCountries: ['usa'],
          actors: [],
        };
      },
      async findActorsForMovies() {
        return new Map();
      },
    },
    eventsRepo: {
      async insertIfNew(eventId) {
        if (events.has(eventId)) return false;
        events.add(eventId);
        return true;
      },
      async remove(eventId) {
        events.delete(eventId);
      },
    },
    watchRepo: {
      async findOne(userId, shortId) {
        return watches.get(`${userId}:${shortId}`) || null;
      },
      async save(doc) {
        watches.set(`${doc.userId}:${doc.shortId}`, JSON.parse(JSON.stringify(doc)));
      },
    },
    profileRepo: {
      async findByUserId(userId) {
        const doc = profiles.get(userId);
        return doc ? JSON.parse(JSON.stringify(doc)) : null;
      },
      async save(profile) {
        profiles.set(profile.userId, JSON.parse(JSON.stringify(profile)));
      },
    },
    statsRepo: {
      async applyDelta() {},
    },
  };
};

const item = (shortId) => ({
  shortId,
  slot: 'explore',
  anchorKey: null,
  type: 'movieShorts',
  contentType: null,
  movieId: 1,
  artistId: null,
  musicKey: null,
  repeat: false,
});

const main = async () => {
  assert.equal(shortScore({
    completions: 0,
    totalPlayedMs: 5000,
    bestPassRatio: 0.05,
  }, { provisional: true }), 0);
  assert.equal(shortScore({
    completions: 0,
    totalPlayedMs: 5000,
    bestPassRatio: 0.05,
  }, { provisional: false }), -1);

  const liked = shortScore({
    completions: 0,
    totalPlayedMs: 4000,
    bestPassRatio: 0.2,
    liked: true,
  }, { provisional: true });
  assert.equal(liked, 1);
  const commented = shortScore({
    completions: 0,
    totalPlayedMs: 4000,
    bestPassRatio: 0.5,
    commented: true,
  }, { provisional: true });
  assert.equal(commented, 3.5);

  const once = applyWatch(null, {
    passRatio: 0.95,
    playedMsDelta: 8000,
    completionsDelta: 1,
    viewId,
    final: true,
  });
  assert.equal(once.completions, 1);
  assert.equal(once.score, 1.5);

  const memory = createMemory();
  let clock = new Date('2026-10-30T12:00:00.000Z');
  const service = createWatchEventService({
    ...memory,
    logger: { error() {} },
    now: () => clock,
  });

  const interim = await service.ingest({
    userId: 'user-1',
    body: body({ passRatio: 0.7, seq: 1, final: false }),
  });
  assert.equal(interim.score, 1);
  assert.equal(memory.watches.get('user-1:movieShorts:1').isProvisional, true);
  assert.equal(memory.profiles.get('user-1').version, 1);
  assert.equal(memory.profiles.get('user-1').session.items.length, 1);

  const again = await service.ingest({
    userId: 'user-1',
    body: body({ passRatio: 0.7, seq: 2, final: false, liked: true }),
  });
  assert.equal(again.score, 3);
  const session = memory.profiles.get('user-1').session.items;
  assert.equal(session.length, 1);
  assert.equal(session[0].score, 3);
  assert.equal(memory.profiles.get('user-1').version, 2);

  const closed = await service.ingest({
    userId: 'user-1',
    body: body({ passRatio: 0.05, playedMsDelta: 1000, seq: 3, final: true }),
  });
  assert.ok(closed.score >= interim.score);
  assert.equal(memory.watches.get('user-1:movieShorts:1').isProvisional, false);
  assert.equal(memory.watches.get('user-1:movieShorts:1').bestPassRatio, 0.7);

  const late = await service.ingest({
    userId: 'user-1',
    body: body({ passRatio: 0.05, seq: 1, final: false }),
  });
  assert.equal(late.status, 'stale');
  assert.equal(memory.profiles.get('user-1').version, 3);
  assert.equal(memory.watches.get('user-1:movieShorts:1').score, 3);

  const duplicateId = randomUUID();
  await service.ingest({
    userId: 'user-1',
    body: body({ eventId: duplicateId, seq: 4, final: true, passRatio: 0.7 }),
  });
  const duplicate = await service.ingest({
    userId: 'user-1',
    body: body({ eventId: duplicateId, seq: 5, final: true, passRatio: 0.7 }),
  });
  assert.equal(duplicate.status, 'duplicate');

  const skipOnly = createMemory();
  const skipService = createWatchEventService({
    ...skipOnly,
    logger: { error() {} },
    now: () => clock,
  });
  const skipped = await skipService.ingest({
    userId: 'user-1',
    body: body({ viewId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', seq: 1, final: true, passRatio: 0.05 }),
  });
  assert.equal(skipped.score, -1);

  const legacy = await skipService.ingest({
    userId: 'user-2',
    body: {
      eventId: randomUUID(),
      shortId: 1,
      passRatio: 1,
      playedMsDelta: 8000,
      ts: clock.toISOString(),
    },
  });
  assert.equal(legacy.score, 1.5);
  assert.equal(skipOnly.watches.get('user-2:movieShorts:1').completions, 1);
  assert.equal(skipOnly.watches.get('user-2:movieShorts:1').isProvisional, false);

  const fatigue = fatigueRows(
    [{ shortId: 'a', anchorKey: 'k' }, { shortId: 'b', anchorKey: 'k' }],
    new Map([
      ['a', { bestPassRatio: 0.1, isProvisional: true }],
      ['b', { bestPassRatio: 0.2, isProvisional: false }],
    ])
  );
  assert.equal(fatigue.length, 1);
  assert.equal(fatigue[0].bestPassRatio, 0.2);

  let window = pushSession({ items: [] }, { shortId: 'movieShorts:1', score: 1, refs: {}, ts: clock });
  window = pushSession(window, { shortId: 'movieShorts:2', score: 1, refs: {}, ts: clock });
  window = pushSession(window, { shortId: 'movieShorts:1', score: 4, refs: {}, ts: clock });
  assert.deepEqual(window.items.map((row) => row.shortId), ['movieShorts:1', 'movieShorts:2']);
  assert.equal(window.items[0].score, 4);

  const store = { doc: null };
  const sessions = {
    async findById(id) {
      return store.doc && store.doc.sessionId === id ? store.doc : null;
    },
    async save(doc) {
      store.doc = doc;
    },
  };
  const feed = createFeedSessionService(sessions, { now: () => clock });
  const opened = await feed.serve({
    userId: 'user-1',
    position: 0,
    limit: 2,
    profileVersion: 1,
    build: async () => ['a', 'b', 'c', 'd', 'e', 'f'].map(item),
  });
  assert.equal(opened.items.length, 6);
  const same = await feed.serve({
    sessionId: opened.sessionId,
    userId: 'user-1',
    position: 0,
    limit: 2,
    profileVersion: 1,
    build: async () => {
      throw new Error('profile did not change');
    },
  });
  assert.deepEqual(same.items.map((row) => row.shortId), opened.items.map((row) => row.shortId));

  const tooSoon = await feed.serve({
    sessionId: opened.sessionId,
    userId: 'user-1',
    position: 0,
    limit: 2,
    profileVersion: 2,
    build: async () => {
      throw new Error('rebuild interval has not elapsed');
    },
  });
  assert.equal(tooSoon.items[4].shortId, 'e');

  clock = new Date(clock.getTime() + config.feedRebuildMinIntervalSeconds * 1000);
  const rebuilt = await feed.serve({
    sessionId: opened.sessionId,
    userId: 'user-1',
    position: 0,
    limit: 2,
    profileVersion: 2,
    build: async () => ['z', 'y'].map(item),
  });
  assert.deepEqual(rebuilt.items.slice(0, 4).map((row) => row.shortId), ['a', 'b', 'c', 'd']);
  assert.equal(rebuilt.items[4].shortId, 'z');
  assert.equal(new Set(rebuilt.items.map((row) => row.shortId)).size, rebuilt.items.length);

  console.log('ok liveWatch');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
