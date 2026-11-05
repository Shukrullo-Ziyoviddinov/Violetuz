'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateProgressReport, mergeSessionProgress, summarizeProgress } = require('../progress/progressProtocol');
const { createProgressService } = require('../services/progress.service');

const report = (seconds = 10, patch = {}) => ({ movieId: 1, trailerId: 2, sessionId: 'session_0000000001',
  durationSec: 60, intervals: seconds ? [[0, seconds]] : [], realWatchedSeconds: seconds, totalPlayedSeconds: seconds, ...patch });

function memoryModel() {
  const rows = [];
  const matches = (row, query) => Object.entries(query).every(([key, value]) => row[key] === value);
  const copy = (row) => row ? JSON.parse(JSON.stringify(row)) : null;
  return {
    rows,
    findOne(query) { return { lean: async () => copy(rows.find((row) => matches(row, query))) }; },
    async create(row) {
      if (rows.some((existing) => matches(existing, { userId: row.userId, movieId: row.movieId, trailerId: row.trailerId, sessionId: row.sessionId }))) {
        throw Object.assign(new Error('duplicate'), { code: 11000 });
      }
      rows.push(copy(row));
    },
    findOneAndUpdate(query, update) { return { lean: async () => {
      const row = rows.find((item) => matches(item, query));
      if (!row) return null;
      Object.assign(row, copy(update.$set));
      row.version += update.$inc.version;
      return copy(row);
    } }; },
    find(query) { const chain = { select() { return chain; }, sort() { return chain; }, lean: async () => rows.filter((row) => matches(row, query)).map(copy) }; return chain; },
  };
}
const movieModel = { findOne: (query) => ({ select: () => ({ lean: async () => query.id === 1 && query['trailersVideo.id'] === 2 ? { id: 1 } : null }) }) };

test('client coverage values are ignored; server derives union coverage', () => {
  const result = validateProgressReport(report(10, { coverage: 1, uniqueWatchedSeconds: 60, intervals: [[0, 8], [5, 10]] }));
  assert.equal(result.uniqueWatchedSeconds, 10);
  assert.equal(result.coverage, 1 / 6);
});

test('same and older snapshots are idempotent; new cumulative snapshots advance', () => {
  const older = report(5);
  const newer = report(10);
  const merged = mergeSessionProgress(older, newer);
  assert.deepEqual(mergeSessionProgress(merged, newer), merged);
  assert.deepEqual(mergeSessionProgress(merged, older), merged);
  assert.equal(merged.realWatchedSeconds, 10);
});

test('2x playback, skipped gaps, and genuine replay survive persistence', () => {
  const first = report(15, { intervals: [[0, 5], [10, 20]], realWatchedSeconds: 7.5 });
  const second = report(25, { intervals: [[0, 5], [10, 20]], realWatchedSeconds: 12.5 });
  const result = mergeSessionProgress(first, second);
  assert.equal(result.uniqueWatchedSeconds, 15);
  assert.equal(result.rewatchedSeconds, 10);
  assert.equal(result.realWatchedSeconds, 12.5);
});

test('rejects malformed reports, duration changes and contradictory session histories', () => {
  for (const patch of [{ movieId: true }, { sessionId: 'short' }, { durationSec: Infinity }, { intervals: [[30, 10]] },
    { intervals: [[0, 61]] }, { realWatchedSeconds: 0 }, { totalPlayedSeconds: 1 }]) {
    assert.throws(() => validateProgressReport(report(10, patch)));
  }
  assert.throws(() => mergeSessionProgress(report(10), report(10, { durationSec: 120 })));
  assert.throws(() => mergeSessionProgress(report(10), report(10, { intervals: [[20, 30]] })));
  assert.throws(() => mergeSessionProgress(report(10), report(15, { realWatchedSeconds: 10 })));
});

test('different sessions add real time but union coverage once', () => {
  const result = summarizeProgress([validateProgressReport(report(10)), validateProgressReport(report(10, { sessionId: 'session_0000000002' }))]);
  assert.equal(result.realWatchedSeconds, 20);
  assert.equal(result.coverage, 1 / 6);
  assert.equal(result.sessionCount, 2);
});

test('account repository handles concurrent retries and stale reports without double-counting', async () => {
  const model = memoryModel();
  const service = createProgressService({ movieModel, progressModel: model });
  await Promise.all([service.report('alice', report(5)), service.report('alice', report(10)), service.report('alice', report(10))]);
  assert.equal(model.rows.length, 1);
  assert.equal((await service.read('alice', 1, 2)).realWatchedSeconds, 10);
  const repeated = await service.report('alice', report(5));
  assert.equal(repeated.changed, false);
  assert.equal((await service.read('bob', 1, 2)).realWatchedSeconds, 0);
  await service.report('bob', report(20));
  assert.equal((await service.read('alice', 1, 2)).realWatchedSeconds, 10);
});

test('server rejects non-existent movie/trailer pairs and missing account identity', async () => {
  const model = memoryModel();
  const service = createProgressService({ movieModel, progressModel: model });
  await assert.rejects(service.report('alice', report(10, { trailerId: 999 })), { status: 404 });
  await assert.rejects(service.report(null, report(10)), { status: 400 });
  await service.report('alice', report(0));
  assert.equal(model.rows.length, 0);
});
