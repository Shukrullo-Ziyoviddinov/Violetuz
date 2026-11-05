'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildCandidatePools, createCandidateService, trailerHomeFeedWeights: weights } = require('..');
const { createExposureReader } = require('../repositories/trailerExposure.read');

const NOW = Date.parse('2026-11-10T12:00:00Z');
const iso = (days = 0) => new Date(NOW - days * 86400_000).toISOString();
const item = (id, patch = {}) => ({ key: `${id}-1`, movieId: id, trailerId: 1, channelId: `channel-${id}`,
  filterGenre: ['Drama'], filterCountry: ['USA'], actors: ['7'], uploadedAt: iso(1), ...patch });
const profile = { hasPersonalTaste: true, dimensions: { genre: [{ value: 'Drama', score: 1 }] }, excludedTrailerKeys: [] };
const seed = 'session_seed_00000001';
const build = (patch = {}) => buildCandidatePools({ catalog: [item(1), item(2)], sessionSeed: seed, nowMs: NOW, ...patch });
const trend = (rows) => ({ generatedAt: iso(), trailers: rows });
const exposure = (rows = []) => ({ generatedAt: iso(), available: true, rows });

test('builds four independent source pools and preserves provenance when sources overlap', () => {
  const result = build({ profile, trendSnapshot: trend([{ key: '1-1', eligible: true, score: 0.8 }]), exposureSnapshot: exposure() });
  assert.equal(result.pools.personal.length, 2);
  assert.equal(result.pools.trending.length, 1);
  assert.equal(result.pools.fresh.length, 2);
  assert.equal(result.pools.exploration.length, 2);
  assert.equal(result.candidates.length, 2);
  assert.deepEqual([...result.candidates.find((row) => row.key === '1-1').sources].sort(), ['exploration', 'fresh', 'personal', 'trending']);
});

test('cold start still has fresh/exploration candidates without fabricated personal or trend evidence', () => {
  const result = build();
  assert.equal(result.pools.personal.length, 0);
  assert.equal(result.pools.trending.length, 0);
  assert.equal(result.pools.fresh.length, 2);
  assert.equal(result.sourceStatus.personal, 'no-taste');
  assert.equal(result.sourceStatus.exploration, 'rotating-unknown-exposure');
  assert.ok(result.pools.exploration.every((row) => row.exposureViewerDays === null && row.scoreAvailable === false));
});

test('personal matching includes relevant content across channels and skips unmatched metadata', () => {
  const result = build({ profile, catalog: [item(1), item(2, { channelId: 'other' }), item(3, { filterGenre: ['Comedy'] })] });
  assert.deepEqual(result.pools.personal.map((row) => row.key).sort(), ['1-1', '2-1']);
  assert.equal(result.pools.exploration.length, 3);
});

test('all eligible channels get a round before a high-volume channel gets another entry', () => {
  const catalog = [...Array.from({ length: 300 }, (_, i) => item(i + 1, { channelId: 'big' })),
    ...Array.from({ length: 10 }, (_, i) => item(i + 1000, { channelId: `small-${i}` }))];
  const result = build({ catalog, profile, exposureSnapshot: exposure() });
  for (const source of ['personal', 'fresh', 'exploration']) {
    const first = result.pools[source].slice(0, 11);
    assert.equal(new Set(first.map((row) => row.channelId)).size, 11);
  }
});

test('configured per-source cap is retained when enough channels can fill the source', () => {
  const catalog = Array.from({ length: 14 }, (_, channel) => Array.from({ length: 20 }, (_, i) => item(channel * 20 + i + 1, { channelId: `channel-${channel}` }))).flat();
  const result = build({ catalog, profile });
  const counts = new Map();
  for (const row of result.pools.personal) counts.set(row.channelId, (counts.get(row.channelId) || 0) + 1);
  assert.ok([...counts.values()].every((count) => count <= weights.candidates.maxPerChannelPerSource));
  assert.equal(result.sourceStats.personal.channelCapRelaxed, false);
});

test('sparse single-channel catalog can fill its pool without inventing more channels', () => {
  const result = build({ catalog: Array.from({ length: 60 }, (_, i) => item(i + 1, { channelId: 'only' })), profile });
  assert.equal(result.pools.personal.length, 60);
  assert.equal(result.sourceStats.personal.channelCapRelaxed, true);
  assert.equal(result.sourceStats.personal.channels, 1);
});

test('missing ownership is one bucket rather than a separate fake channel for each trailer', () => {
  const result = build({ catalog: Array.from({ length: 30 }, (_, i) => item(i + 1, { channelId: null })) });
  assert.equal(result.sourceStats.exploration.channels, 1);
  assert.ok(result.pools.exploration.every((row) => row.channelId === null));
});

test('exploration prioritizes measured underexposure for channels and entries without a rating threshold', () => {
  const catalog = [item(1, { channelId: 'popular', rating: 5 }), item(2, { channelId: 'small', rating: null })];
  const result = build({ catalog, exposureSnapshot: exposure([{ key: '1-1', viewerDays: 100 }]) });
  assert.equal(result.pools.exploration[0].key, '2-1');
  assert.equal(result.pools.exploration[0].exposureViewerDays, 0);
  assert.ok(result.pools.exploration[0].score > result.pools.exploration[1].score);
});

test('same session is stable; new seeds rotate equal/unknown discovery opportunities', () => {
  const catalog = Array.from({ length: 140 }, (_, i) => item(i + 1, { uploadedAt: null }));
  const one = build({ catalog });
  assert.deepEqual(one, build({ catalog }));
  const two = build({ catalog, sessionSeed: 'session_seed_00000002' });
  assert.notDeepEqual(one.pools.exploration.map((row) => row.key), two.pools.exploration.map((row) => row.key));
  const covered = new Set();
  for (let i = 1; i <= 12; i += 1) for (const row of build({ catalog, sessionSeed: `rotation_seed_${String(i).padStart(8, '0')}` }).pools.exploration) covered.add(row.key);
  assert.equal(covered.size, 140);
});

test('fresh means an actual valid upload timestamp, not release year, id or future data', () => {
  const result = build({ catalog: [item(1, { uploadedAt: null, year: 2026 }), item(2, { uploadedAt: iso(-1) }),
    item(3, { uploadedAt: iso(31) }), item(4, { uploadedAt: iso(2) }), item(5, { uploadedAt: iso(1) })] });
  assert.deepEqual(new Set(result.pools.fresh.map((row) => row.key)), new Set(['4-1', '5-1']));
  assert.ok(result.pools.fresh.find((row) => row.key === '5-1').score > result.pools.fresh.find((row) => row.key === '4-1').score);
  assert.equal(result.pools.exploration.length, 5);
});

test('stale/future or ineligible trend does not silently become measured popularity', () => {
  const stale = build({ trendSnapshot: { ...trend([{ key: '1-1', score: 1, eligible: true }]), generatedAt: iso(1) } });
  assert.equal(stale.pools.trending.length, 0);
  const result = build({ trendSnapshot: trend([{ key: '1-1', score: 1, eligible: false }, { key: '2-1', score: Infinity, eligible: true }]) });
  assert.equal(result.pools.trending.length, 0);
  const unknown = build({ exposureSnapshot: { ...exposure(), generatedAt: iso(-1) } });
  assert.equal(unknown.sourceStatus.exploration, 'rotating-unknown-exposure');
});

test('malformed exposure evidence is unknown rather than a manufactured zero', () => {
  const result = build({ exposureSnapshot: exposure([{ key: '1-1', viewerDays: -1 }]) });
  assert.equal(result.sourceStatus.exploration, 'rotating-unknown-exposure');
  assert.ok(result.pools.exploration.every((row) => row.exposureViewerDays === null));
});

test('hard exclusions apply to every source before trimming; duplicates cannot create extra slots', () => {
  const result = build({ catalog: [item(1), item(1), item(2), item(3)], profile: { ...profile, excludedTrailerKeys: ['1-1'] }, excludeKeys: ['2-1'],
    trendSnapshot: trend([{ key: '1-1', score: 1, eligible: true }]) });
  assert.deepEqual(result.candidates.map((row) => row.key), ['3-1']);
  assert.equal(result.excludedSize, 2);
});

test('global candidate cap preserves channels and does not simply drop the last source', () => {
  const catalog = Array.from({ length: 440 }, (_, i) => item(i + 1, { filterGenre: [i < 160 ? 'Drama' : 'Comedy'], uploadedAt: i >= 260 && i < 340 ? iso(1) : null }));
  const result = build({ catalog, profile,
    trendSnapshot: trend(catalog.slice(160, 260).map((row) => ({ key: row.key, eligible: true, score: 0.8 }))),
    exposureSnapshot: exposure(catalog.slice(0, 340).map((row) => ({ key: row.key, viewerDays: 100 }))),
  });
  assert.equal(result.candidates.length, 400);
  assert.equal(new Set(result.candidates.map((row) => row.key)).size, 400);
  assert.equal(new Set(result.candidates.map((row) => row.channelId)).size, 400);
  for (const source of ['personal', 'trending', 'fresh', 'exploration']) assert.ok(result.pools[source].length > 0);
});

test('source inputs are not mutated and failures/invalid context are not concealed', async () => {
  const input = { catalog: [item(1)], profile, exposureSnapshot: exposure() };
  const original = JSON.stringify(input);
  build(input);
  assert.equal(JSON.stringify(input), original);
  let reads = 0;
  const bad = createCandidateService({ readCatalog: async () => { reads++; return []; } });
  await assert.rejects(bad.collect({ sessionSeed: 'bad' }));
  assert.equal(reads, 0);
  const failed = createCandidateService({ readCatalog: async () => [], readProfile: async () => null,
    readTrending: async () => { throw new Error('trend unavailable'); } });
  await assert.rejects(failed.collect({ sessionSeed: seed, nowMs: NOW }), /trend unavailable/);
});

test('exposure reader counts qualified viewer-days and reports account-only scope honestly', async () => {
  let pipeline;
  const read = createExposureReader({ actionModel: { aggregate: async (stages) => { pipeline = stages; return [{ _id: { movieId: 1, trailerId: 1 }, viewerDays: 3 }]; } } });
  const result = await read({ nowMs: NOW });
  assert.equal(pipeline[0].$match.type, 'impression');
  assert.equal(pipeline[1].$group._id.userId, '$userId');
  assert.equal(pipeline[1].$group._id.day.$dateToString.timezone, 'UTC');
  assert.equal(result.scope, 'account-impressions');
  assert.deepEqual(result.rows, [{ key: '1-1', viewerDays: 3 }]);
});
