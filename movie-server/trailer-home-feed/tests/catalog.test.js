'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildTrailerCatalog, readTrailerCatalog } = require('..');

const trailer = (id, patch = {}) => ({ id, trailers: { uz: '/video/a.mp4' }, title: { uz: 'Trailer' }, ...patch });
const movie = (id, patch = {}) => ({ id, channelId: 'channel-a', trailersVideo: [trailer(1)], ...patch });

test('catalog imports do not load Mongoose or connect to the database', () => {
  assert.ok(!Object.keys(require.cache).some((path) => /[\\/]mongoose[\\/]/.test(path)));
});

test('uses only parent movie dimensions and ownership across all channels', () => {
  const rows = buildTrailerCatalog([
    movie(5, { filterGenre: ['Drama', 'Drama', ' Action '], filterCountry: ' Uzbekistan ', actors: [1, '1', 'artist-a'],
      genre: ['WRONG'], country: 'WRONG', trailersVideo: [trailer(1, { channelId: 'wrong', filterGenre: ['WRONG'], trillerimg: '/trailer.jpg' })] }),
    movie(6, { channelId: 'channel-b' }),
  ]);
  assert.deepEqual(rows.map((row) => row.channelId), ['channel-a', 'channel-b']);
  assert.deepEqual(rows[0].filterGenre, ['Drama', 'Action']);
  assert.deepEqual(rows[0].filterCountry, ['Uzbekistan']);
  assert.deepEqual(rows[0].actors, ['1', 'artist-a']);
  assert.equal(rows[0].trillerimg, '/trailer.jpg');
  assert.equal(rows[0].key, '5-1');
});

test('deduplicates by the movie/trailer pair and preserves valid input order', () => {
  const rows = buildTrailerCatalog([
    movie('2', { createdAt: '2020-01-01', trailersVideo: [trailer('3'), trailer(3), trailer(1)] }),
    movie(1, { createdAt: '2026-01-01', trailersVideo: [trailer(3)] }),
    movie(2, { trailersVideo: [trailer(3)] }),
  ]);
  assert.deepEqual(rows.map((row) => row.key), ['2-3', '2-1', '1-3']);
  assert.deepEqual(rows.map((row) => row.trailerIndex), [1, 3, 1]);
});

test('skips malformed identities, empty video sources and non-array trailer lists', () => {
  assert.deepEqual(buildTrailerCatalog(null), []);
  const rows = buildTrailerCatalog([null, movie(true), movie(-1), movie(Number.MAX_SAFE_INTEGER + 1),
    movie(1, { trailersVideo: {} }),
    movie(2, { trailersVideo: [null, trailer(false), trailer(0), trailer(1.5), trailer(1, { trailers: { uz: ' ', ru: 5 } }),
      trailer(2, { trailers: { ru: '/valid.mp4' } })] }),
  ]);
  assert.deepEqual(rows.map((row) => row.key), ['2-2']);
  assert.deepEqual(rows[0].trailers, { ru: '/valid.mp4' });
});

test('takes trailer upload time first, then valid parent time, without inventing dates', () => {
  const rows = buildTrailerCatalog([
    movie(1, { createdAt: new Date('2025-01-01'), trailersVideo: [trailer(1, { createdAt: 'bad', uploadedAt: '2026-02-01' }), trailer(2)] }),
    movie(2, { createdAt: 'bad', uploadedAt: '2024-01-01' }),
    movie(3, { year: 2026 }),
  ]);
  assert.equal(rows[0].uploadedAt, '2026-02-01T00:00:00.000Z');
  assert.equal(rows[0].uploadTimeSource, 'trailer.uploadedAt');
  assert.equal(rows[1].uploadedAt, '2025-01-01T00:00:00.000Z');
  assert.equal(rows[2].uploadTimeSource, 'movie.uploadedAt');
  assert.equal(rows[3].uploadedAt, null);
});

test('output is detached from input and missing channel is a shared unknown value', () => {
  const movies = [movie(1, { channelId: '', homeImg: { uz: '/fallback.jpg' }, filterGenre: ['Drama'] })];
  const original = JSON.stringify(movies);
  const rows = buildTrailerCatalog(movies);
  assert.equal(rows[0].channelId, null);
  assert.equal(rows[0].trillerimg, '/fallback.jpg');
  rows[0].filterGenre.push('Action');
  rows[0].trailers.uz = '/changed.mp4';
  rows[0].title.uz = 'Changed';
  assert.equal(JSON.stringify(movies), original);
});

test('reader requests only required fields without limiting or filtering channels', async () => {
  const calls = {};
  const query = {
    select(projection) { calls.projection = projection; return this; },
    sort(order) { calls.order = order; return this; },
    async lean() { return [movie(2), movie(3, { channelId: 'channel-b' })]; },
  };
  const rows = await readTrailerCatalog({ movieModel: { find(filter) { calls.filter = filter; return query; } } });
  assert.equal(rows.length, 2);
  assert.equal(calls.filter.channelId, undefined);
  assert.deepEqual(calls.filter['trailersVideo.0'], { $exists: true });
  for (const field of ['id', 'filterGenre', 'filterCountry', 'actors', 'channelId', 'trailersVideo', 'createdAt', 'uploadedAt']) {
    assert.equal(calls.projection[field], 1);
  }
  assert.deepEqual(calls.order, { id: 1 });
});

test('repository errors propagate rather than masquerading as an empty catalog', async () => {
  await assert.rejects(readTrailerCatalog({ movieModel: { find() { throw new Error('database unavailable'); } } }), /database unavailable/);
});
