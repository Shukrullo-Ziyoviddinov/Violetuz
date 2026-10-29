'use strict';

const assert = require('node:assert/strict');
const { createCatalogSync } = require('../services/catalogSync.service');

const silent = { info() {}, warn() {}, error() {} };

const run = async () => {
  const tracks = [
    {
      kind: 'music',
      id: 802,
      artistId: 'jah-khalib',
      title: 'Subwoofer',
      genre: 'dubstep',
      country: 'uzbekistan',
      language: 'uzbek',
      clipId: 550,
    },
    {
      kind: 'klip',
      id: 550,
      artistId: 'jah-khalib',
      title: 'Other',
      genre: 'pop',
      country: 'usa',
      language: 'english',
      musicId: 802,
    },
  ];

  const stored = { records: [], groups: [], removedShorts: null };
  const sync = createCatalogSync({
    connection: {},
    logger: silent,
    sources: {
      music: { loadAllTracks: async () => tracks },
      shorts: {
        loadMovieShorts: async () => [
          {
            role: 'movie',
            type: 'movieShorts',
            numericId: 1,
            sourceType: 'movieShorts',
            movieId: 4,
            musicId: 802,
          },
        ],
        loadMusicShorts: async () => [
          {
            role: 'music',
            type: 'musicshorts',
            numericId: 10001,
            sourceType: 'musicshorts',
            musicId: 550,
            artistId: 'jah-khalib',
            movieId: 4,
            contentType: 'klip',
          },
        ],
      },
      movies: {
        findByIds: async (ids) => {
          assert.deepEqual(ids, [4, 4]);
          return new Map([
            [4, { filterGenre: ['Jangari'], filterCountry: 'USA', actors: [7], franchiseMovieIds: [8] }],
          ]);
        },
      },
      artists: {
        findByIds: async (ids) => {
          assert.deepEqual(ids, ['jah-khalib']);
          return new Map([['jah-khalib', { id: 'jah-khalib', genres: ['Rock'], country: 'britaniya' }]]);
        },
      },
    },
    catalogRepo: {
      bulkUpsert: async (records) => {
        stored.records.push(...records);
        return { upserted: records.length, modified: 0 };
      },
      removeExcept: async (ids) => {
        stored.removedShorts = ids;
        return 0;
      },
    },
    songLinksRepo: {
      bulkUpsert: async (groups) => {
        stored.groups = groups;
        return { upserted: groups.length, modified: 0 };
      },
      removeExcept: async () => 0,
    },
  });

  const summary = await sync.runOnce();
  assert.equal(summary.movieShorts, 1);
  assert.equal(summary.musicShorts, 1);
  assert.equal(summary.songGroups, 1);
  assert.equal(stored.groups[0].method, 'catalogRef');
  assert.equal(stored.groups[0].songGroupId, 'song:music:802');
  assert.equal(stored.records[0].shortId, 'movieShorts:1');
  assert.equal(stored.records[0].musicKey, 'music:802');
  assert.equal(stored.records[0].artistId, 'jah-khalib');
  assert.equal(stored.records[0].songGroupId, 'song:music:802');
  assert.deepEqual(stored.records[0].actors, [7]);
  assert.equal(stored.records[1].shortId, 'musicshorts:10001');
  assert.equal(stored.records[1].musicKey, 'klip:550');
  assert.equal(stored.records[1].songGroupId, 'song:music:802');
  assert.deepEqual(stored.records[1].actors, []);
  assert.deepEqual(stored.records[1].musicGenres, ['pop', 'rock']);
  assert.deepEqual(stored.removedShorts, ['movieShorts:1', 'musicshorts:10001']);

  let wiped = false;
  const emptySync = createCatalogSync({
    connection: {},
    logger: silent,
    sources: {
      music: { loadAllTracks: async () => [] },
      shorts: {
        loadMovieShorts: async () => [],
        loadMusicShorts: async () => [],
      },
      movies: { findByIds: async () => new Map() },
      artists: { findByIds: async () => new Map() },
    },
    catalogRepo: {
      bulkUpsert: async () => ({ upserted: 0, modified: 0 }),
      removeExcept: async (ids) => {
        wiped = ids.length === 0;
        return 0;
      },
    },
    songLinksRepo: {
      bulkUpsert: async () => ({ upserted: 0, modified: 0 }),
      removeExcept: async () => 0,
    },
  });
  const emptySummary = await emptySync.runOnce();
  assert.equal(emptySummary.skipped, false);
  assert.equal(wiped, true);

  let removed = false;
  const broken = createCatalogSync({
    connection: {},
    logger: silent,
    sources: {
      music: { loadAllTracks: async () => [] },
      shorts: {
        loadMovieShorts: async () => [
          { role: 'movie', type: 'movieShorts', numericId: null, movieId: 1, musicId: null },
        ],
        loadMusicShorts: async () => [],
      },
      movies: { findByIds: async () => new Map() },
      artists: { findByIds: async () => new Map() },
    },
    catalogRepo: {
      bulkUpsert: async () => ({ upserted: 0, modified: 0 }),
      removeExcept: async () => {
        removed = true;
        return 0;
      },
    },
    songLinksRepo: {
      bulkUpsert: async () => ({ upserted: 0, modified: 0 }),
      removeExcept: async () => 0,
    },
  });
  await assert.rejects(() => broken.runOnce());
  assert.equal(removed, false);

  console.log('ok catalogSync');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
