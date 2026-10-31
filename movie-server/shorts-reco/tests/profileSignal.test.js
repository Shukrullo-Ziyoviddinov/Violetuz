'use strict';

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const collections = require('../config/collections');
const { createProfileHeatRepo } = require('../repositories/profileHeat.repo');
const { createWatchEventService } = require('../services/watchEvent.service');
const { profileSignals } = require('../services/profileHeat/record');

const clone = (value) => {
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map(clone);
  if (value && typeof value === 'object') {
    const copy = {};
    Object.keys(value).forEach((key) => {
      copy[key] = clone(value[key]);
    });
    return copy;
  }
  return value;
};

const sameFilter = (row, filter) =>
  Object.keys(filter).every((key) => row[key] === filter[key]);

const createTables = () => {
  const tables = new Map();
  const rowsOf = (name) => {
    if (!tables.has(name)) tables.set(name, []);
    return tables.get(name);
  };
  return {
    rowsOf,
    collection(name) {
      const rows = rowsOf(name);
      return {
        async findOne(filter) {
          const found = rows.find((row) => sameFilter(row, filter));
          return found ? clone(found) : null;
        },
        async replaceOne(filter, doc, options) {
          const index = rows.findIndex((row) => sameFilter(row, filter));
          if (index >= 0) rows[index] = clone(doc);
          else if (options && options.upsert) rows.push(clone(doc));
        },
      };
    },
  };
};

const createMemory = () => {
  const events = new Set();
  const watches = new Map();
  const profiles = new Map();
  const catalogs = new Map();
  const stats = [];

  return {
    catalogs,
    profiles,
    watches,
    stats,
    catalogRepo: {
      async findByClientShortId(shortId) {
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

const catalog = (shortId, extra) => ({
  shortId,
  type: 'musicshorts',
  movieId: null,
  musicKey: null,
  actors: [],
  ...extra,
});

assert.deepEqual(
  profileSignals({
    previous: null,
    next: { completions: 1, liked: false, commented: false },
    event: { passRatio: 1, final: true },
  }),
  { likes: 0, comments: 0, rewatches: 0, passes: 0 }
);
assert.equal(
  profileSignals({
    previous: { completions: 1, liked: true, commented: false },
    next: { completions: 2, liked: true, commented: true },
    event: { passRatio: 1, final: true },
  }).rewatches,
  1
);
assert.equal(
  profileSignals({
    previous: { completions: 1, liked: true, commented: true },
    next: { completions: 1, liked: true, commented: true },
    event: { passRatio: 1, final: true },
  }).likes,
  0
);
assert.equal(
  profileSignals({
    previous: null,
    next: { completions: 0, liked: false, commented: false },
    event: { passRatio: 0.4, final: false },
  }).passes,
  0
);
assert.equal(
  profileSignals({
    previous: null,
    next: { completions: 0, liked: false, commented: false },
    event: { passRatio: 0.05, final: true },
  }).passes,
  1
);

const ts = '2026-10-31T18:00:00.000Z';
const skipId = randomUUID();
const likeView = randomUUID();

const bodies = [
  { eventId: randomUUID(), shortId: 1, passRatio: 0.01, playedMsDelta: 100, ts },
  { eventId: skipId, shortId: 1, passRatio: 0.05, playedMsDelta: 5000, ts },
  { eventId: randomUUID(), shortId: 1, passRatio: 1, playedMsDelta: 10000, ts },
  { eventId: randomUUID(), shortId: 1, passRatio: 1, playedMsDelta: 10000, ts },
  {
    eventId: randomUUID(),
    shortId: 1,
    passRatio: 1,
    playedMsDelta: 0,
    liked: true,
    viewId: likeView,
    seq: 1,
    ts,
  },
  {
    userId: 'user-2',
    eventId: randomUUID(),
    shortId: 10001,
    passRatio: 1,
    playedMsDelta: 8000,
    commented: true,
    ts,
  },
  { eventId: skipId, shortId: 1, passRatio: 0.05, playedMsDelta: 5000, ts },
  { eventId: randomUUID(), shortId: 2, passRatio: 0.4, playedMsDelta: 4000, final: false, ts },
  { eventId: randomUUID(), shortId: 2, passRatio: 0.4, playedMsDelta: 1000, final: true, ts },
  { eventId: randomUUID(), shortId: 3, passRatio: 0.05, playedMsDelta: 5000, ts },
];

const seedCatalogs = (memory) => {
  memory.catalogs.set('1', catalog('musicshorts:1', { artistId: 'jah-khalib' }));
  memory.catalogs.set('2', catalog('musicshorts:2', { artistId: 'jah-khalib' }));
  memory.catalogs.set('3', catalog('musicshorts:3', { artistId: null }));
  memory.catalogs.set('10001', catalog('musicshorts:10001', { artistId: 'jah-khalib', movieId: 9 }));
};

const runEvents = async (service) => {
  const results = [];
  for (let i = 0; i < bodies.length; i += 1) {
    const body = bodies[i];
    results.push(await service.ingest({
      userId: body.userId || 'user-1',
      body,
    }));
  }
  return results;
};

const run = async () => {
  const plainMemory = createMemory();
  seedCatalogs(plainMemory);
  const plain = createWatchEventService({
    ...plainMemory,
    logger: { error() {} },
    now: () => new Date(ts),
    recordProfileSignal: async () => {},
  });

  const db = createTables();
  const heatRepo = createProfileHeatRepo(db);
  await heatRepo.saveHeat({
    key: 'artist:s:jah-khalib',
    kind: 'artist',
    id: 'jah-khalib',
    days: [{ day: '2026-08-01', likes: 9, comments: 0, rewatches: 0 }],
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  });
  const recordedMemory = createMemory();
  seedCatalogs(recordedMemory);
  const recorded = createWatchEventService({
    ...recordedMemory,
    profileHeatRepo: heatRepo,
    logger: { error() {} },
    now: () => new Date(ts),
  });

  const plainResults = await runEvents(plain);
  const recordedResults = await runEvents(recorded);

  assert.deepEqual(
    recordedResults.map((result) => ({ status: result.status, score: result.score })),
    plainResults.map((result) => ({ status: result.status, score: result.score }))
  );
  assert.deepEqual(
    recordedResults.map((result) => result.score),
    [0, -1, 1.5, 3.5, 5.5, 4.5, undefined, 0.5, 0.5, -1]
  );
  assert.equal(recordedResults[6].status, 'duplicate');
  assert.equal(
    JSON.stringify(recordedMemory.profiles.get('user-1').longTerm),
    JSON.stringify(plainMemory.profiles.get('user-1').longTerm)
  );

  const heat = await heatRepo.findHeat('artist:s:jah-khalib');
  assert.equal(heat.id, 'jah-khalib');
  assert.equal(typeof heat.id, 'string');
  assert.deepEqual(heat.days, [
    { day: '2026-10-31', likes: 1, comments: 1, rewatches: 1 },
  ]);

  const slow = await heatRepo.findUserSlowdown('user-1', 'artist:s:jah-khalib');
  assert.deepEqual(slow.days, [{ day: '2026-10-31', passes: 3 }]);
  assert.equal(slow.likes, undefined);
  assert.equal(await heatRepo.findUserSlowdown('user-2', 'artist:s:jah-khalib'), null);
  assert.equal(db.rowsOf(collections.reco.userProfiles).length, 0);

  const failingMemory = createMemory();
  seedCatalogs(failingMemory);
  let failures = 0;
  const failing = createWatchEventService({
    ...failingMemory,
    profileHeatRepo: {
      async findHeat() {
        return null;
      },
      async saveHeat() {
        throw new Error('heat down');
      },
      async findUserSlowdown() {
        return null;
      },
      async saveUserSlowdown() {
        throw new Error('slow down');
      },
    },
    logger: {
      error() {
        failures += 1;
      },
    },
    now: () => new Date(ts),
  });
  const broken = await failing.ingest({
    userId: 'user-1',
    body: { eventId: randomUUID(), shortId: 1, passRatio: 0.05, playedMsDelta: 5000, ts },
  });
  assert.equal(broken.status, 'ok');
  assert.equal(broken.score, -1);
  assert.equal(failingMemory.watches.get('user-1:musicshorts:1').score, -1);
  assert.equal(failures, 1);

  console.log('ok profileSignal');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
