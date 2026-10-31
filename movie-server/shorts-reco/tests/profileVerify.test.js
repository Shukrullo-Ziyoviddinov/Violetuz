'use strict';

const assert = require('node:assert/strict');
const { createProfileHeatRepo } = require('../repositories/profileHeat.repo');
const { activityScore } = require('../services/profileHeat/heat');
const { createProfileSliceService } = require('../services/profileHeat/slice');
const { createFeedService } = require('../services/feed/feed.service');
const { queryDocs } = require('../services/feed/sources/match');

const now = new Date('2026-10-31T12:00:00.000Z');

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

const createMemory = () => {
  const tables = new Map();
  const rowsOf = (name) => {
    if (!tables.has(name)) tables.set(name, []);
    return tables.get(name);
  };
  return {
    collection() {
      const rows = rowsOf('heat');
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
        find(filter) {
          const list = rows.filter((row) => sameFilter(row, filter || {}));
          return {
            async toArray() {
              return list.map(clone);
            },
          };
        },
      };
    },
  };
};

const mainDocs = [
  { shortId: 'movieShorts:1', type: 'movieShorts', movieId: 1, artistId: 'a', catalogAddedAt: '2026-02-01' },
  { shortId: 'movieShorts:2', type: 'movieShorts', movieId: 2, artistId: 'b', catalogAddedAt: '2026-01-01' },
  { shortId: 'musicshorts:3', type: 'musicshorts', movieId: null, artistId: 'c', catalogAddedAt: '2026-02-02' },
  { shortId: 'musicshorts:4', type: 'musicshorts', movieId: null, artistId: 'd', catalogAddedAt: '2026-01-02' },
];

const counts = (day, likes) => [{ day, likes, comments: 0, rewatches: 0 }];

const heatDoc = (id, days) => ({
  key: `artist:s:${id}`,
  kind: 'artist',
  id,
  days,
  updatedAt: now,
});

const short = (shortId, artistId) => ({
  shortId,
  type: 'musicshorts',
  artistId,
  movieId: null,
  musicKey: null,
  musicGenres: [],
  movieGenres: [],
});

const ids = (page) => page.items.map((item) => item.shortId);

const createSession = () => ({
  saved: null,
  async findById(id) {
    return this.saved && this.saved.sessionId === id ? this.saved : null;
  },
  async save(doc) {
    this.saved = doc;
  },
});

const serve = async ({ heatRepo, artistShorts, userId }) => {
  const slice = createProfileSliceService({
    heatRepo,
    catalogRepo: {
      async findByArtistId(artistId) {
        return artistShorts.filter((row) => row.artistId === artistId);
      },
    },
    now: () => now,
  });
  const feed = createFeedService({
    catalogRepo: {
      async findMatching(filter, limit, sort) {
        return queryDocs(mainDocs, filter, limit, sort);
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
      async save() {},
    },
    statsRepo: {
      async listTop() {
        return [];
      },
    },
    sessionRepo: createSession(),
    profileSlice: slice,
    logger: { error() {} },
  });
  return feed.serveFeed({ userId: userId || null, now });
};

const extras = (page, plain) => {
  const base = ids(plain);
  const full = ids(page);
  assert.deepEqual(full.slice(0, base.length), base);
  return full.slice(base.length);
};

const run = async () => {
  const plain = await serve({
    heatRepo: createProfileHeatRepo(createMemory()),
    artistShorts: [],
  });
  assert.ok(plain.items.length >= 2);

  const emptyHeat = createProfileHeatRepo(createMemory());
  const emptyPage = await serve({ heatRepo: emptyHeat, artistShorts: [] });
  assert.deepEqual(ids(emptyPage), ids(plain));

  const ancientOnly = createProfileHeatRepo(createMemory());
  await ancientOnly.saveHeat(heatDoc('ancient', counts('2026-08-01', 1000)));
  const ancientPage = await serve({
    heatRepo: ancientOnly,
    artistShorts: [short('musicshorts:301', 'ancient')],
  });
  assert.deepEqual(ids(ancientPage), ids(plain));
  assert.equal(activityScore(counts('2026-08-01', 1000), now), 0);

  const capped = createProfileHeatRepo(createMemory());
  await capped.saveHeat(heatDoc('jah-khalib', counts('2026-10-31', 10)));
  await capped.saveHeat(heatDoc('shohruhxon', counts('2026-10-31', 6)));
  await capped.saveHeat(heatDoc('third', counts('2026-10-31', 4)));
  const cappedPage = await serve({
    heatRepo: capped,
    artistShorts: [
      short('musicshorts:101', 'jah-khalib'),
      short('musicshorts:111', 'jah-khalib'),
      short('musicshorts:102', 'shohruhxon'),
      short('musicshorts:103', 'third'),
    ],
  });
  assert.deepEqual(extras(cappedPage, plain), ['musicshorts:101', 'musicshorts:102']);

  const shared = createProfileHeatRepo(createMemory());
  await shared.saveHeat(heatDoc('jah-khalib', counts('2026-10-31', 10)));
  await shared.saveHeat(heatDoc('shohruhxon', counts('2026-10-31', 6)));
  await shared.saveHeat(heatDoc('third', counts('2026-10-31', 4)));
  await shared.saveUserSlowdown({
    userId: 'user-1',
    key: 'artist:s:jah-khalib',
    kind: 'artist',
    id: 'jah-khalib',
    days: [{ day: '2026-10-31', passes: 3 }],
    updatedAt: now,
  });
  const stored = JSON.stringify(await shared.findHeat('artist:s:jah-khalib'));
  const artistShorts = [
    short('musicshorts:101', 'jah-khalib'),
    short('musicshorts:102', 'shohruhxon'),
    short('musicshorts:103', 'third'),
  ];
  const skipped = await serve({ heatRepo: shared, artistShorts, userId: 'user-1' });
  const other = await serve({ heatRepo: shared, artistShorts, userId: 'user-2' });
  assert.deepEqual(extras(skipped, plain), ['musicshorts:102', 'musicshorts:103']);
  assert.deepEqual(extras(other, plain), ['musicshorts:101', 'musicshorts:102']);
  assert.equal(JSON.stringify(await shared.findHeat('artist:s:jah-khalib')), stored);

  const ranked = createProfileHeatRepo(createMemory());
  await ranked.saveHeat(heatDoc('fresh', counts('2026-10-31', 10)));
  await ranked.saveHeat(heatDoc('aging', counts('2026-10-21', 10)));
  await ranked.saveHeat(heatDoc('ancient', counts('2026-08-01', 1000)));
  const todayScore = activityScore(counts('2026-10-31', 10), now);
  const olderScore = activityScore(counts('2026-10-21', 10), now);
  assert.ok(todayScore > olderScore);
  assert.equal(activityScore(counts('2026-08-01', 1000), now), 0);
  const rankedPage = await serve({
    heatRepo: ranked,
    artistShorts: [
      short('musicshorts:201', 'fresh'),
      short('musicshorts:203', 'aging'),
      short('musicshorts:301', 'ancient'),
    ],
  });
  assert.deepEqual(extras(rankedPage, plain), ['musicshorts:201', 'musicshorts:203']);

  const repeated = createProfileHeatRepo(createMemory());
  await repeated.saveHeat(heatDoc('jah-khalib', counts('2026-10-31', 10)));
  const repeatedPage = await serve({
    heatRepo: repeated,
    artistShorts: [
      { ...mainDocs[0], artistId: 'jah-khalib' },
      short('musicshorts:101', 'jah-khalib'),
    ],
  });
  const repeatedIds = ids(repeatedPage);
  assert.equal(repeatedIds.filter((id) => id === 'movieShorts:1').length, 1);
  assert.equal(repeatedIds[repeatedIds.length - 1], 'musicshorts:101');
  assert.equal(new Set(repeatedIds).size, repeatedIds.length);

  console.log('ok profileVerify');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
