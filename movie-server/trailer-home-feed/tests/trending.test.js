'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildTrendObservations, scoreTrailerTrending, createTrendingService } = require('..');
const { createTrendReader } = require('../repositories/trailerTrend.read');

const NOW = Date.parse('2026-11-10T12:00:00Z');
const iso = (hours = 0) => new Date(NOW - hours * 3600_000).toISOString();
const catalog = [1, 2, 3].map((movieId) => ({ key: `${movieId}-1`, movieId, trailerId: 1, channelId: `channel-${movieId}` }));
const session = (userId, movieId = 1, patch = {}) => ({ userId, movieId, trailerId: 1, sessionId: 'session_0000000001',
  durationSec: 60, intervals: [[0, 60]], realWatchedSeconds: 30, totalPlayedSeconds: 60, createdAt: iso(1), updatedAt: iso(0), ...patch });
const action = (userId, type = 'impression', patch = {}) => ({ userId, movieId: 1, trailerId: 1, eventId: `event_0000000_${userId}`,
  type, surface: 'home', visibleRatio: 0.5, visibleMs: 1000, occurredAt: iso(1), ...patch });
const reaction = (userId, value = 'like', patch = {}) => ({ userId, type: 'movieTriller', targetId: '1-1', value, updatedAt: iso(1), ...patch });
const observations = (rows) => buildTrendObservations({ catalog, nowMs: NOW, ...rows });
const scores = (rows) => scoreTrailerTrending({ catalog, nowMs: NOW, observations: observations(rows) });
const byKey = (rows, key = '1-1') => rows.find((row) => row.key === key);
const audience = (count, movieId = 1, patch = {}) => Array.from({ length: count }, (_, i) => session(`viewer_${String(i).padStart(4, '0')}`, movieId, patch));

test('catalog channels all remain present; no activity has honest zero scores and missing rates', () => {
  const rows = scores({});
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((row) => row.channelId), ['channel-1', 'channel-2', 'channel-3']);
  assert.ok(rows.every((row) => row.score === 0 && !row.eligible && row.parts.coverage === null));
});

test('meaningful watches by many people produce trend, not a single perfect sample', () => {
  const rows = scores({ sessions: [...audience(60, 1), ...audience(1, 2)] });
  assert.equal(rows[0].key, '1-1');
  assert.ok(byKey(rows).score > 0);
  assert.equal(byKey(rows, '2-1').score, 0);
  assert.equal(byKey(rows, '2-1').eligible, false);
});

test('small samples remain lower than equally good established evidence', () => {
  const rows = scores({ sessions: [...audience(60, 1), ...audience(3, 2)] });
  assert.ok(byKey(rows).score > byKey(rows, '2-1').score);
  assert.ok(byKey(rows, '2-1').evidenceConfidence < 0.15);
  assert.ok(byKey(rows, '2-1').priors.coverage > 0);
});

test('equal recent engagement outranks old engagement with 48-hour half-life', () => {
  const rows = scores({ sessions: [...audience(30, 1, { createdAt: iso(1) }), ...audience(30, 2, { createdAt: iso(49) })] });
  assert.ok(byKey(rows).score > byKey(rows, '2-1').score);
  const ratio = byKey(rows, '2-1').effectiveViewerMass / byKey(rows).effectiveViewerMass;
  assert.ok(Math.abs(ratio - 0.5) < 1e-9);
});

test('session retries, repeated opens and daily observations cannot manufacture distinct viewers', () => {
  const sessions = audience(3);
  const once = scores({ sessions, actions: [action('viewer_0000', 'open')] });
  const repeated = scores({ sessions: [...sessions, ...sessions, ...sessions],
    actions: [action('viewer_0000', 'open'), action('viewer_0000', 'open'), action('viewer_0000', 'open', { eventId: 'another_event_00001' })] });
  assert.deepEqual(repeated, once);
  const oneAcrossDays = Array.from({ length: 7 }, (_, i) => session('same_viewer', 1, { sessionId: `session_day_0000${i}`, createdAt: iso(i * 24) }));
  const row = byKey(scores({ sessions: oneAcrossDays }));
  assert.equal(row.distinctViewers, 1);
  assert.equal(row.eligible, false);
});

test('stale cumulative progress is not revived by an updatedAt timestamp or an open', () => {
  const old = audience(10, 1, { createdAt: iso(200), updatedAt: iso(0) });
  const rows = scores({ sessions: old, actions: [action('viewer_0000', 'open')] });
  assert.equal(byKey(rows).distinctMeaningfulViewers, 0);
  assert.equal(byKey(rows).score, 0);
});

test('impressions without meaningful interest never become popularity by themselves', () => {
  const rows = scores({ actions: audience(100).map((s) => action(s.userId)), sessions: audience(30, 2) });
  assert.equal(byKey(rows).score, 0);
  assert.equal(byKey(rows).impressionViewerDays, 100);
});

test('uninterested exposure reduces coverage/conversion rates instead of adding fake interest', () => {
  const rows = scores({ sessions: [...audience(10, 1), ...audience(10, 2)],
    actions: Array.from({ length: 100 }, (_, i) => action(`exposed_${String(i).padStart(4, '0')}`, 'impression', { movieId: 2 })) });
  assert.ok(byKey(rows).score > byKey(rows, '2-1').score);
});

test('canonical current likes and dislikes affect scores without mutating or accumulating votes', () => {
  const sessions = audience(20);
  const likes = sessions.map((s) => reaction(s.userId));
  const input = { sessions, reactions: likes };
  const original = JSON.stringify(input);
  const liked = byKey(scores(input));
  const neutral = byKey(scores({ sessions }));
  const disliked = byKey(scores({ sessions, reactions: sessions.map((s) => reaction(s.userId, 'dislike')) }));
  assert.ok(liked.score > neutral.score);
  assert.ok(disliked.score < neutral.score);
  assert.equal(JSON.stringify(input), original);
  assert.deepEqual(scores(input), scores(input));
});

test('movie navigation is separate from mere opening and improves conversion signal', () => {
  const sessions = [...audience(20, 1), ...audience(20, 2)];
  const rows = scores({ sessions, actions: audience(20).map((s) => action(s.userId, 'openMovie')) });
  assert.ok(byKey(rows).parts.movieOpens > byKey(rows, '2-1').parts.movieOpens);
  assert.ok(byKey(rows).score > byKey(rows, '2-1').score);
});

test('invalid, future, outside-window and wrong-type source data is ignored', () => {
  const rows = observations({ sessions: [null, session('a', 1, { createdAt: 'bad' }), session('a', 1, { createdAt: iso(-1) }),
    session('a', 1, { createdAt: iso(1), updatedAt: iso(-1) }), session('a', 99)],
    reactions: [null, reaction('a', 'like', { type: 'movie' }), reaction('a', 'like', { updatedAt: iso(200) })],
    actions: [null, action('a', 'impression', { visibleMs: 50 }), action('a', 'open', { occurredAt: iso(-1) })] });
  assert.deepEqual(rows, []);
});

test('trusted guest source uses a separate viewer namespace; local histories are not invented as global data', async () => {
  const source = { actions: [], sessions: audience(3), reactions: [] };
  const common = { readCatalog: async () => catalog, readAccounts: async () => source };
  const noGuests = await createTrendingService(common).compute({ nowMs: NOW });
  assert.equal(noGuests.sources.guests, 'not-ingested');
  const withGuests = await createTrendingService({ ...common, readTrustedGuests: async () => source }).compute({ nowMs: NOW });
  assert.equal(withGuests.sources.guests, 'verified-reader');
  assert.equal(byKey(withGuests.trailers).distinctViewers, 6);
  assert.ok(byKey(withGuests.trailers).score > byKey(noGuests.trailers).score);
});

test('reader only requests the real recent window and existing trailer reaction type', async () => {
  const queries = [];
  const model = (kind) => ({ find(query) { queries.push({ kind, query }); return { select: () => ({ lean: async () => [] }) }; } });
  await createTrendReader({ actionModel: model('actions'), progressModel: model('progress'), reactionModel: model('reactions') })({
    fromMs: NOW - 7 * 86400_000, nowMs: NOW, catalog,
  });
  assert.ok(queries.find((row) => row.kind === 'progress').query.createdAt);
  assert.equal(queries.find((row) => row.kind === 'reactions').query.type, 'movieTriller');
  assert.ok(queries.every((row) => !row.query.channelId));
});

test('read failures propagate instead of returning fabricated or partial trend', async () => {
  const service = createTrendingService({ readCatalog: async () => catalog, readAccounts: async () => { throw new Error('DB unavailable'); } });
  await assert.rejects(service.compute({ nowMs: NOW }), /DB unavailable/);
});
