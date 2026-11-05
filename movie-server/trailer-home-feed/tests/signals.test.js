'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateSignalAction } = require('../signals/signalProtocol');
const { deriveSignalState } = require('../signals/deriveSignalState');
const { createSignalsService } = require('../services/signals.service');

const action = (type = 'open', patch = {}) => ({ movieId: 1, trailerId: 2, type, surface: 'home', eventId: 'event_000000000001', ...patch });
const progress = (seconds = 20, patch = {}) => ({ movieId: 1, trailerId: 2, sessionId: 'session_0000000001', durationSec: 60,
  intervals: seconds ? [[0, seconds]] : [], realWatchedSeconds: seconds / 2, totalPlayedSeconds: seconds, ...patch });

test('impressions need at least half the card visible for a second and award no points', () => {
  assert.throws(() => validateSignalAction(action('impression', { visibleRatio: 0.49, visibleMs: 2000 })));
  assert.throws(() => validateSignalAction(action('impression', { visibleRatio: 1, visibleMs: 999 })));
  const accepted = validateSignalAction(action('impression', { visibleRatio: 0.5, visibleMs: 1000, points: 100, userId: 'other' }));
  assert.equal(accepted.points, undefined);
  assert.equal(accepted.userId, undefined);
  assert.equal(deriveSignalState({ actions: [accepted] }).interestScore, 0);
});

test('clients cannot claim watches or submit reactions as events', () => {
  for (const type of ['like', 'dislike', 'completion', 'meaningfulWatch', 'rewatch']) assert.throws(() => validateSignalAction(action(type)));
  assert.throws(() => validateSignalAction(action('open', { eventId: 'bad' })));
  const state = deriveSignalState({ actions: [action(), action(), action()] });
  assert.equal(state.interestScore, 0.05);
  assert.equal(state.flags.meaningfulWatch, false);
});

test('watch flags use actual union coverage at 2x, never maximum playhead position', () => {
  const skipped = progress(5, { intervals: [[55, 60]] });
  assert.equal(deriveSignalState({ sessions: [skipped] }).flags.meaningfulWatch, false);
  const watched = deriveSignalState({ sessions: [progress(20)] });
  assert.equal(watched.flags.meaningfulWatch, true);
  assert.equal(watched.flags.completion, false);
  assert.equal(deriveSignalState({ sessions: [progress(60)] }).flags.completion, true);
});

test('rewatches are bounded and repeated state reads do not add points', () => {
  const input = { sessions: [progress(60, { totalPlayedSeconds: 90, realWatchedSeconds: 45 })],
    actions: [action('open'), action('openMovie')], reaction: { value: 'like' } };
  const first = deriveSignalState(input);
  assert.equal(first.flags.rewatch, true);
  assert.equal(first.contributions.rewatch, 0.15);
  assert.equal(first.interestScore, 2.5);
  assert.deepEqual(deriveSignalState(input), first);
});

test('canonical reaction replacement/removal replaces its contribution instead of accumulating', () => {
  assert.equal(deriveSignalState({ reaction: { value: 'like' } }).interestScore, 0.8);
  assert.equal(deriveSignalState({ reaction: { value: 'dislike' }, sessions: [progress(60)] }).interestScore, -1);
  assert.equal(deriveSignalState({ reaction: null }).interestScore, 0);
});

function fixtures() {
  const rows = [];
  const sessions = [];
  let reaction = null;
  let lastReactionQuery;
  let clock = Date.parse('2026-11-05T23:59:00Z');
  const match = (row, query) => Object.entries(query).every(([key, value]) => row[key] === value);
  const models = {
    movieModel: { findOne: (q) => ({ select: () => ({ lean: async () => q.id === 1 && q['trailersVideo.id'] === 2 ? { id: 1 } : null }) }) },
    actionModel: {
      async updateOne(query, update) {
        if (rows.some((row) => match(row, query))) return { upsertedCount: 0 };
        rows.push({ ...update.$setOnInsert });
        return { upsertedCount: 1 };
      },
      async aggregate(pipeline) {
        const filtered = rows.filter((row) => match(row, pipeline[0].$match));
        return [...new Set(filtered.map((row) => row.type))].map((type) => ({ type }));
      },
    },
    progressModel: { find: (query) => ({ select: () => ({ lean: async () => sessions.filter((s) => match(s, query)) }) }) },
    reactionModel: { findOne(query) { lastReactionQuery = query; return { select: () => ({ lean: async () => reaction }) }; } },
  };
  return { rows, sessions, models, now: () => clock, advance: () => { clock += 120_000; },
    setReaction: (value) => { reaction = value; }, reactionQuery: () => lastReactionQuery };
}

test('receipts deduplicate across retries and midnight; distinct repeated opens still earn one daily contribution', async () => {
  const f = fixtures();
  const service = createSignalsService({ ...f.models, now: f.now });
  assert.equal((await service.report('alice', action())).changed, true);
  assert.equal((await service.report('alice', action())).changed, false);
  await service.report('alice', action('open', { eventId: 'event_000000000002', surface: 'channel' }));
  assert.equal((await service.read('alice', { movieId: 1, trailerId: 2 })).interestScore, 0.05);
  f.advance();
  assert.equal((await service.report('alice', action())).changed, false);
  const nextDay = await service.read('alice', { movieId: 1, trailerId: 2 });
  assert.equal(nextDay.flags.open, false);
  assert.equal(f.rows.length, 2);
});

test('service uses account-scoped progress and reads movieTriller reaction without changing it', async () => {
  const f = fixtures();
  const service = createSignalsService({ ...f.models, now: f.now });
  f.sessions.push({ ...progress(), userId: 'alice' });
  f.setReaction({ value: 'like' });
  const read = await service.read('alice', { movieId: 1, trailerId: 2 });
  assert.equal(read.flags.meaningfulWatch, true);
  assert.equal(read.flags.like, true);
  assert.deepEqual(f.reactionQuery(), { userId: 'alice', type: 'movieTriller', targetId: '1-2' });
  assert.equal((await service.read('bob', { movieId: 1, trailerId: 2 })).flags.meaningfulWatch, false);
  assert.equal(f.rows.length, 0);
  f.setReaction(null);
  assert.equal((await service.read('alice', { movieId: 1, trailerId: 2 })).flags.like, false);
});

test('missing auth, unknown trailer and fabricated watch events are rejected before writing', async () => {
  const f = fixtures();
  const service = createSignalsService({ ...f.models, now: f.now });
  await assert.rejects(service.report(null, action()), { status: 400 });
  await assert.rejects(service.report('alice', action('open', { trailerId: 999 })), { status: 404 });
  await assert.rejects(service.report('alice', action('meaningfulWatch')), { status: 400 });
  assert.equal(f.rows.length, 0);
});
