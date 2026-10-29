'use strict';

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createWatchEventService } = require('../services/watchEvent.service');

const near = (actual, expected) => {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} !== ${expected}`);
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const createMemory = () => {
  const events = new Set();
  const watches = new Map();
  const profiles = new Map();
  const catalogs = new Map();
  const stats = [];
  let finds = 0;

  return {
    catalogs,
    stats,
    watches,
    profiles,
    get finds() {
      return finds;
    },
    catalogRepo: {
      async findByClientShortId(shortId) {
        finds += 1;
        return catalogs.get(String(shortId)) || null;
      },
      async findActorsForMovies(ids) {
        const found = new Map();
        ids.forEach((id) => found.set(id, []));
        return found;
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
        watches.set(`${doc.userId}:${doc.shortId}`, clone(doc));
      },
    },
    profileRepo: {
      async findByUserId(userId) {
        const doc = profiles.get(userId);
        return doc ? clone(doc) : null;
      },
      async save(profile) {
        profiles.set(profile.userId, clone(profile));
      },
    },
    statsRepo: {
      async applyDelta(shortId, delta) {
        stats.push({ shortId, ...delta });
      },
    },
  };
};

const run = async () => {
  const memory = createMemory();
  const ts = '2026-10-29T12:00:00.000Z';
  memory.catalogs.set('1', {
    shortId: 'movieShorts:1',
    type: 'movieShorts',
    movieId: 4,
    musicKey: 'music:802',
    artistId: 'jah-khalib',
    movieGenres: ['jangari'],
    movieTypeCategories: [],
    movieCountries: ['usa'],
    musicGenres: [],
    musicCountries: [],
    actors: [7],
  });
  memory.catalogs.set('10001', {
    shortId: 'musicshorts:10001',
    type: 'musicshorts',
    contentType: 'music',
    movieId: 9,
    musicKey: 'music:802',
    artistId: 'jah-khalib',
    musicGenres: ['pop'],
    musicCountries: ['uzbekistan'],
    actors: [99],
  });

  const service = createWatchEventService({
    ...memory,
    logger: { error() {} },
    now: () => new Date(ts),
  });

  const ignored = await service.ingest({ userId: null, body: {} });
  assert.equal(ignored.status, 'ignored');
  assert.equal(memory.finds, 0);

  const invalid = await service.ingest({
    userId: 'user-1',
    body: {
      eventId: randomUUID(),
      shortId: 1,
      passRatio: 2,
      playedMsDelta: 10,
    },
  });
  assert.equal(invalid.status, 'invalid');
  assert.equal(memory.finds, 0);

  const missing = await service.ingest({
    userId: 'user-1',
    body: {
      eventId: randomUUID(),
      shortId: 99,
      passRatio: 0.2,
      playedMsDelta: 10,
    },
  });
  assert.equal(missing.status, 'not_found');

  const flick = await service.ingest({
    userId: 'user-1',
    body: {
      eventId: randomUUID(),
      shortId: 1,
      passRatio: 0.01,
      playedMsDelta: 100,
      ts,
    },
  });
  assert.equal(flick.status, 'ok');
  assert.equal(flick.score, 0);
  assert.equal(memory.profiles.get('user-1').longTerm.movies['m:4'], undefined);

  const skipId = randomUUID();
  const skipped = await service.ingest({
    userId: 'user-1',
    body: { eventId: skipId, shortId: 1, passRatio: 0.05, playedMsDelta: 5000, ts },
  });
  assert.equal(skipped.score, -1);
  near(memory.profiles.get('user-1').longTerm.movies['m:4'], -0.5);

  const fullId = randomUUID();
  const full = await service.ingest({
    userId: 'user-1',
    body: { eventId: fullId, shortId: 1, passRatio: 1, playedMsDelta: 10000, ts },
  });
  assert.equal(full.score, 1.5);
  const after = memory.profiles.get('user-1');
  near(after.longTerm.movies['m:4'], 1.5);
  near(after.longTerm.movieEngagementRaw['4'], 1.5);
  near(after.longTerm.types['t:movieShorts'], 1.05);
  assert.equal(after.longTerm.actorPenalty['ac:7'], undefined);
  assert.equal(memory.watches.get('user-1:movieShorts:1').completions, 1);

  const duplicate = await service.ingest({
    userId: 'user-1',
    body: { eventId: fullId, shortId: 1, passRatio: 1, playedMsDelta: 10000, ts },
  });
  assert.equal(duplicate.status, 'duplicate');
  near(memory.profiles.get('user-1').longTerm.movies['m:4'], 1.5);
  assert.equal(memory.watches.get('user-1:movieShorts:1').completions, 1);
  assert.equal(memory.stats.filter((row) => row.shortId === 'movieShorts:1').length, 3);

  const music = await service.ingest({
    userId: 'user-2',
    body: { eventId: randomUUID(), shortId: 10001, passRatio: 1, playedMsDelta: 8000, ts },
  });
  assert.equal(music.score, 1.5);
  const musicProfile = memory.profiles.get('user-2');
  near(musicProfile.longTerm.movies['m:9'], 0.6);
  assert.equal(musicProfile.longTerm.movieEngagementRaw['9'], undefined);
  assert.equal(musicProfile.longTerm.actorPenalty['ac:99'], undefined);

  console.log('ok watchEvent');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
