'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { rankTrailerCandidates, buildRepetitionState, createFinalRankingService, buildCandidatePools } = require('..');
const { sourceSharesForProfile } = require('../rank/sourceShares');
const { createRepetitionReader } = require('../repositories/repetition.read');

const NOW = Date.parse('2026-11-10T12:00:00Z');
const iso = (hours = 0) => new Date(NOW - hours * 3600_000).toISOString();
const SEED = 'ranking_seed_00000001';
const TYPES = ['personal', 'trending', 'fresh', 'exploration'];
const profile = (count) => ({ hasPersonalTaste: count > 0, effectiveMeaningfulTrailers: count,
  confidence: { combined: Math.min(1, count / 20) }, excludedTrailerKeys: [] });
const item = (id, patch = {}) => ({ key: `${id}-1`, movieId: id, trailerId: 1, channelId: `channel-${id}`,
  filterGenre: [`genre-${id % 4}`], filterCountry: [`country-${id}`], actors: [`actor-${id}`], ...patch });
const snapshot = (sizes = [60, 60, 60, 60], patch = () => ({})) => {
  const candidates = [];
  const pools = {};
  let id = 0;
  TYPES.forEach((source, sourceIndex) => {
    pools[source] = Array.from({ length: sizes[sourceIndex] }, () => {
      const row = item(++id, patch(id, source));
      candidates.push(row);
      return { key: row.key, score: 1 };
    });
  });
  return { candidates, pools };
};
const rank = (patch = {}) => rankTrailerCandidates({ candidateSnapshot: snapshot(), sessionSeed: SEED, nowMs: NOW, ...patch });
const session = (patch = {}) => ({ movieId: 1, trailerId: 1, sessionId: 'session_0000000001', durationSec: 60,
  intervals: [[0, 60]], realWatchedSeconds: 30, totalPlayedSeconds: 60, createdAt: iso(1), updatedAt: iso(0), ...patch });

test('cold/developing/experienced source proportions interpolate smoothly', () => {
  assert.deepEqual(sourceSharesForProfile(profile(0)).shares, { personal: 0, trending: 0.6, fresh: 0.2, exploration: 0.2 });
  assert.deepEqual(sourceSharesForProfile(profile(5)).shares, { personal: 0.3, trending: 0.4, fresh: 0.15, exploration: 0.15 });
  assert.deepEqual(sourceSharesForProfile(profile(20)).shares, { personal: 0.6, trending: 0.2, fresh: 0.1, exploration: 0.1 });
  const between = sourceSharesForProfile(profile(2.5)).shares;
  assert.equal(between.personal, 0.15);
  assert.equal(between.trending, 0.5);
  const warmMovieViewer = sourceSharesForProfile({ hasPersonalTaste: true, effectiveMeaningfulTrailers: 0, confidence: { combined: 0.35 } });
  assert.ok(warmMovieViewer.shares.personal > 0);
});

test('full diverse pools achieve cold 60/20/20 and mature 60/20/10/10 allocations', () => {
  const cold = rank({ profile: profile(0) });
  assert.deepEqual(cold.sourceCounts, { personal: 0, trending: 24, fresh: 8, exploration: 8 });
  const mature = rank({ profile: profile(20) });
  assert.deepEqual(mature.sourceCounts, { personal: 24, trending: 8, fresh: 4, exploration: 4 });
  assert.ok(mature.items.every((row) => row.relaxedConstraints.length === 0));
});

test('empty or exhausted sources redistribute their slots without duplicates or placeholders', () => {
  const noTrend = rank({ profile: profile(0), candidateSnapshot: snapshot([0, 0, 60, 60]) });
  assert.deepEqual(noTrend.sourceCounts, { personal: 0, trending: 0, fresh: 20, exploration: 20 });
  const scarce = rank({ profile: profile(20), candidateSnapshot: snapshot([1, 1, 1, 50]) });
  assert.equal(scarce.items.length, 40);
  assert.equal(scarce.sourceCounts.personal, 1);
  assert.equal(scarce.sourceCounts.trending, 1);
  assert.equal(scarce.sourceCounts.fresh, 1);
  assert.equal(new Set(scarce.items.map((row) => row.key)).size, 40);
});

test('source overlaps assign a trailer once even after every soft constraint is relaxed', () => {
  const candidate = item(1);
  const overlap = { candidates: [candidate, candidate], pools: Object.fromEntries(TYPES.map((source) => [source, [{ key: candidate.key, score: 1 }]])) };
  const result = rank({ profile: profile(20), candidateSnapshot: overlap });
  assert.equal(result.items.length, 1);
});

test('adequate inventory avoids adjacent channels and enforces per-window movie/channel limits', () => {
  const data = snapshot([0, 0, 0, 80], (id) => ({ movieId: Math.ceil(id / 2), trailerId: id % 2 + 1,
    key: `${Math.ceil(id / 2)}-${id % 2 + 1}`, channelId: `channel-${id % 8}` }));
  const result = rank({ candidateSnapshot: data });
  for (let i = 1; i < result.items.length; i += 1) assert.notEqual(result.items[i].channelId, result.items[i - 1].channelId);
  for (let i = 0; i < result.items.length; i += 1) {
    const window = result.items.slice(Math.max(0, i - 9), i + 1);
    assert.equal(new Set(window.map((row) => row.movieId)).size, window.length);
    for (const channel of new Set(window.map((row) => row.channelId))) assert.ok(window.filter((row) => row.channelId === channel).length <= 2);
  }
});

test('sparse catalog progressively relaxes diversity, including one-channel and one-movie inventory', () => {
  const data = snapshot([0, 0, 0, 15], (id) => ({ key: `1-${id}`, movieId: 1, trailerId: id, channelId: 'only',
    filterGenre: ['Drama'], filterCountry: ['USA'], actors: ['7'] }));
  const result = rank({ candidateSnapshot: data });
  assert.equal(result.items.length, 15);
  assert.ok(result.relaxations.adjacentChannel > 0);
  assert.ok(result.relaxations.movie > 0);
  assert.ok(result.relaxations.channel > 0);
  assert.equal(new Set(result.items.map((row) => row.key)).size, 15);
});

test('hard dislike/completion exclusions never return even when all diversity rules relax', () => {
  const data = snapshot([0, 0, 0, 5]);
  const result = rank({ candidateSnapshot: data, repetitionState: { hardExcludedKeys: ['1-1', '2-1', '3-1', '4-1'] },
    profile: { ...profile(0), excludedTrailerKeys: ['5-1'] } });
  assert.equal(result.items.length, 0);
});

test('completed cooldown uses real coverage, expires at 72 hours, and ignores seek-to-end', () => {
  assert.deepEqual(buildRepetitionState({ nowMs: NOW, sessions: [session()] }).hardExcludedKeys, ['1-1']);
  assert.deepEqual(buildRepetitionState({ nowMs: NOW, sessions: [session({ createdAt: iso(72) })] }).hardExcludedKeys, []);
  assert.deepEqual(buildRepetitionState({ nowMs: NOW, sessions: [session({ intervals: [[59, 60]], totalPlayedSeconds: 1, realWatchedSeconds: 0.5 })] }).hardExcludedKeys, []);
});

test('old completion does not become fresh on retry or a tiny new watch; a new complete watch does', () => {
  const old = session({ createdAt: iso(100), updatedAt: iso(0) });
  const tiny = session({ sessionId: 'session_0000000002', intervals: [[0, 1]], totalPlayedSeconds: 1, realWatchedSeconds: 0.5 });
  assert.deepEqual(buildRepetitionState({ nowMs: NOW, sessions: [old, tiny] }).hardExcludedKeys, []);
  const replay = session({ sessionId: 'session_0000000003' });
  assert.deepEqual(buildRepetitionState({ nowMs: NOW, sessions: [old, replay] }).hardExcludedKeys, ['1-1']);
});

test('partial watches can first complete across sessions without duplicate retry inflation', () => {
  const first = session({ createdAt: iso(80), intervals: [[0, 30]], totalPlayedSeconds: 30, realWatchedSeconds: 15 });
  const second = session({ sessionId: 'session_0000000002', intervals: [[30, 60]], totalPlayedSeconds: 30, realWatchedSeconds: 15 });
  const result = buildRepetitionState({ nowMs: NOW, sessions: [first, second, second] });
  assert.deepEqual(result.hardExcludedKeys, ['1-1']);
});

test('current dislike has its own cooldown; removed/replaced/future reactions do not persist as a penalty', () => {
  const dislike = { type: 'movieTriller', targetId: '1-1', value: 'dislike', updatedAt: iso(1) };
  assert.deepEqual(buildRepetitionState({ nowMs: NOW, reactions: [dislike] }).hardExcludedKeys, ['1-1']);
  assert.deepEqual(buildRepetitionState({ nowMs: NOW, reactions: [dislike, { ...dislike, value: 'like', updatedAt: iso(0) }] }).hardExcludedKeys, []);
  assert.deepEqual(buildRepetitionState({ nowMs: NOW, reactions: [{ ...dislike, updatedAt: iso(-1) }] }).hardExcludedKeys, []);
});

test('repeated impressions are deduplicated and softly deprioritize instead of becoming permanent exclusions', () => {
  const impression = (id) => ({ movieId: 1, trailerId: 1, eventId: `event_00000000000${id}`, type: 'impression', surface: 'home',
    visibleMs: 1000, visibleRatio: 0.5, occurredAt: iso(1) });
  const repetition = buildRepetitionState({ nowMs: NOW, actions: [impression(1), impression(1), impression(2), impression(3)] });
  assert.deepEqual(repetition.impressions, [{ key: '1-1', count: 3 }]);
  assert.deepEqual(repetition.hardExcludedKeys, []);
  const result = rank({ candidateSnapshot: snapshot([0, 0, 0, 2]), repetitionState: repetition });
  assert.equal(result.items[0].key, '2-1');
  assert.equal(result.items.length, 2);
});

test('ranking is deterministic, immutable and returns meaningful positions/source diagnostics', () => {
  const data = snapshot();
  const before = JSON.stringify(data);
  const first = rank({ candidateSnapshot: data, profile: profile(20) });
  assert.deepEqual(rank({ candidateSnapshot: data, profile: profile(20) }), first);
  assert.equal(JSON.stringify(data), before);
  assert.deepEqual(first.items.map((row) => row.position), Array.from({ length: 40 }, (_, i) => i + 1));
});

test('service excludes cooldowns BEFORE gathering pools, then ranks a cold-start feed', async () => {
  let excluded;
  const service = createFinalRankingService({ readProfile: async () => profile(0), readHistory: async () => ({ sessions: [session()] }),
    collectCandidates: async (context) => {
      excluded = context.excludeKeys;
      return buildCandidatePools({ catalog: Array.from({ length: 50 }, (_, i) => item(i + 1, { uploadedAt: iso(1) })),
        sessionSeed: context.sessionSeed, nowMs: NOW, excludeKeys: context.excludeKeys });
    } });
  const result = await service.rank({ sessionSeed: SEED, nowMs: NOW, excludeKeys: ['2-1', '3-1'] });
  assert.deepEqual(excluded, ['2-1', '3-1', '1-1']);
  assert.ok(result.items.every((row) => !['1-1', '2-1', '3-1'].includes(row.key)));
  assert.equal(result.items.length, 40);
});

test('empty inventory stays empty and invalid size/context is rejected before reads', async () => {
  assert.equal(rank({ candidateSnapshot: snapshot([0, 0, 0, 0]) }).items.length, 0);
  let reads = 0;
  const service = createFinalRankingService({ readProfile: async () => { reads++; }, readHistory: async () => ({}) });
  await assert.rejects(service.rank({ sessionSeed: SEED, limit: 41 }));
  await assert.rejects(service.rank({ sessionSeed: 'bad' }));
  assert.equal(reads, 0);
});

test('continuation keeps the previous page channel boundary when alternatives exist', () => {
  const candidates = [item(1, { channelId: 'same' }), item(2, { channelId: 'other' })];
  const result = rank({ limit: 1, previousItems: [item(99, { channelId: 'same' })],
    candidateSnapshot: { candidates, pools: { exploration: candidates.map((row, index) => ({ key: row.key, score: 1 - index * .1 })) } } });
  assert.equal(result.items[0].key, '2-1');
  assert.deepEqual(result.items[0].relaxedConstraints, []);
});

test('history reader scopes every query to the account and reads actual timestamps', async () => {
  const queries = [];
  const model = (kind) => ({ find(query) { queries.push({ kind, query }); return { select: () => ({ lean: async () => [] }) }; } });
  const read = createRepetitionReader({ progressModel: model('progress'), actionModel: model('actions'), reactionModel: model('reactions') });
  await read('alice', { nowMs: NOW });
  assert.ok(queries.every((row) => row.query.userId === 'alice'));
  assert.equal(queries.find((row) => row.kind === 'actions').query.type, 'impression');
  assert.equal(queries.find((row) => row.kind === 'reactions').query.type, 'movieTriller');
  assert.ok(queries.find((row) => row.kind === 'progress').query.createdAt);
});
