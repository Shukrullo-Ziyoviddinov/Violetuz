'use strict';

const assert = require('node:assert/strict');
const collections = require('../config/collections');
const { createCatalogRepo } = require('../repositories/catalog.repo');
const { createProfileHeatRepo } = require('../repositories/profileHeat.repo');
const { musicGenreProfileKey } = require('../utils/keys');
const { selectProfileSlice, createProfileSliceService } = require('../services/profileHeat/slice');

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
    rowsOf,
    collection(name) {
      if (name === collections.reco.userProfiles) {
        throw new Error('user profile store was opened');
      }
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
        find(filter) {
          const list = rows.filter((row) => sameFilter(row, filter || {}));
          const state = { list };
          return {
            limit(size) {
              state.list = state.list.slice(0, size);
              return this;
            },
            toArray() {
              return Promise.resolve(state.list.map(clone));
            },
          };
        },
      };
    },
  };
};

const now = new Date('2026-10-31T12:00:00.000Z');
const popKey = musicGenreProfileKey('pop');
const today = [{ day: '2026-10-31', likes: 0, comments: 0, rewatches: 0 }];
const heat = (key, id, likes) => ({
  key,
  kind: 'artist',
  id,
  days: [{ day: '2026-10-31', likes, comments: 0, rewatches: 0 }],
});
const short = (shortId, artistId, genres) => ({
  shortId,
  artistId,
  musicGenres: genres,
  movieGenres: [],
});

const jah = heat('artist:s:jah-khalib', 'jah-khalib', 10);
const shoh = heat('artist:s:shohruhxon', 'shohruhxon', 4);
const quiet = {
  key: 'artist:s:old',
  kind: 'artist',
  id: 'old',
  days: [{ day: '2026-08-01', likes: 100, comments: 0, rewatches: 0 }],
};
const shortsByKey = {
  'artist:s:jah-khalib': [
    short('musicshorts:1', 'jah-khalib', []),
    short('musicshorts:2', 'jah-khalib', ['pop']),
    short('musicshorts:2', 'jah-khalib', ['pop']),
    short('musicshorts:3', 'jah-khalib', ['pop']),
    short('musicshorts:9', '1', []),
  ],
  'artist:s:shohruhxon': [
    short('musicshorts:4', 'shohruhxon', []),
    short('musicshorts:5', 'shohruhxon', ['pop']),
  ],
  'artist:s:old': [short('musicshorts:8', 'old', ['pop'])],
};

const ids = (rows) => rows.map((row) => row.shortId);

const base = {
  shortsByKey,
  now,
  genreScores: { [popKey]: 2 },
};

const chosen = selectProfileSlice([jah, shoh, quiet, { ...jah, kind: 'actor', key: 'actor:n:1', id: 1 }], base);
assert.deepEqual(ids(chosen), ['musicshorts:2', 'musicshorts:5']);

const noGenre = selectProfileSlice([jah, shoh], { shortsByKey, now });
assert.deepEqual(ids(noGenre), ['musicshorts:1', 'musicshorts:4']);

const blocked = new Map([
  ['musicshorts:2', { lastSeenAt: '2026-10-30T12:00:00.000Z' }],
  ['musicshorts:3', { lastSeenAt: '2026-10-30T12:00:00.000Z' }],
]);
const withoutBlocked = selectProfileSlice([jah, shoh], { ...base, watches: blocked });
assert.deepEqual(ids(withoutBlocked), ['musicshorts:5', 'musicshorts:1']);

const repeated = selectProfileSlice(
  [heat('artist:s:jah-khalib', 'jah-khalib', 6)],
  {
    shortsByKey: {
      'artist:s:jah-khalib': [short('musicshorts:7', 'jah-khalib', [])],
    },
    watches: new Map([['musicshorts:7', { lastSeenAt: '2026-10-26T12:00:00.000Z' }]]),
    now,
  }
);
assert.deepEqual(ids(repeated), []);
const repeatOpen = selectProfileSlice(
  [heat('artist:s:jah-khalib', 'jah-khalib', 6)],
  {
    shortsByKey: {
      'artist:s:jah-khalib': [
        short('musicshorts:7', 'jah-khalib', []),
        short('musicshorts:1', 'jah-khalib', []),
      ],
    },
    watches: new Map([['musicshorts:7', { lastSeenAt: '2026-10-26T12:00:00.000Z', liked: true }]]),
    now,
    repeat: { anchorIsTop2: true, unseenRemaining: false, repeatsUsed: 0 },
  }
);
assert.deepEqual(ids(repeatOpen), ['musicshorts:1']);

const slowed = selectProfileSlice([jah, shoh], {
  ...base,
  slowdownByKey: {
    'artist:s:jah-khalib': { days: [{ day: '2026-10-31', passes: 1 }] },
  },
});
assert.deepEqual(ids(slowed), ['musicshorts:5', 'musicshorts:2']);

const paused = selectProfileSlice([jah, shoh], {
  ...base,
  slowdownByKey: {
    'artist:s:jah-khalib': { days: [{ day: '2026-10-31', passes: 3 }] },
  },
});
assert.deepEqual(ids(paused), ['musicshorts:5']);
assert.equal(jah.days[0].likes, 10);

const excluded = selectProfileSlice([jah, shoh], {
  ...base,
  exclude: ['musicshorts:2'],
});
assert.deepEqual(ids(excluded), ['musicshorts:3', 'musicshorts:5']);

const run = async () => {
  const db = createMemory();
  const heatRepo = createProfileHeatRepo(db);
  const catalogRepo = createCatalogRepo(db);
  const catalog = db.rowsOf(collections.reco.shortCatalog);
  catalog.push(
    short('musicshorts:1', 'jah-khalib', []),
    short('musicshorts:2', 'jah-khalib', ['pop']),
    short('musicshorts:4', 'shohruhxon', []),
    short('musicshorts:11', 1, []),
    short('musicshorts:12', '1', ['pop'])
  );
  await heatRepo.saveHeat({ ...jah, updatedAt: now });
  await heatRepo.saveHeat({ ...shoh, updatedAt: now });
  await heatRepo.saveHeat({ ...quiet, updatedAt: now });
  await heatRepo.saveHeat({
    key: 'artist:n:1',
    kind: 'artist',
    id: 1,
    days: today.map((row) => ({ ...row, likes: 3 })),
    updatedAt: now,
  });
  await heatRepo.saveUserSlowdown({
    userId: 'user-1',
    key: 'artist:s:jah-khalib',
    kind: 'artist',
    id: 'jah-khalib',
    days: [{ day: '2026-10-31', passes: 3 }],
    updatedAt: now,
  });

  const queried = [];
  const service = createProfileSliceService({
    heatRepo: {
      listHeat: () => heatRepo.listHeat(),
      findUserSlowdown: (userId, key) => heatRepo.findUserSlowdown(userId, key),
      saveHeat() {
        throw new Error('heat was written from the slice');
      },
      saveUserSlowdown() {
        throw new Error('slowdown was written from the slice');
      },
    },
    catalogRepo: {
      findByArtistId(artistId, limit) {
        queried.push(artistId);
        return catalogRepo.findByArtistId(artistId, limit);
      },
    },
    now: () => now,
  });

  const forPaused = await service.selectForUser({
    userId: 'user-1',
    genreScores: { [popKey]: 2 },
  });
  const forOther = await service.selectForUser({
    userId: 'user-2',
    genreScores: { [popKey]: 2 },
  });

  assert.deepEqual(ids(forPaused), ['musicshorts:4', 'musicshorts:11']);
  assert.deepEqual(ids(forOther), ['musicshorts:2', 'musicshorts:4']);
  assert.ok(queried.includes('jah-khalib'));
  assert.ok(queried.includes(1));
  assert.equal(queried.includes('1'), false);
  assert.equal(queried.includes('old'), false);
  assert.equal((await heatRepo.findHeat('artist:s:jah-khalib')).days[0].likes, 10);
  assert.equal(db.rowsOf(collections.reco.userProfiles).length, 0);

  const byNumber = await catalogRepo.findByArtistId(1);
  const byText = await catalogRepo.findByArtistId('1');
  assert.deepEqual(byNumber.map((row) => row.shortId), ['musicshorts:11']);
  assert.deepEqual(byText.map((row) => row.shortId), ['musicshorts:12']);

  console.log('ok profileSlice');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
