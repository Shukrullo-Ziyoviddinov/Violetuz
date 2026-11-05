'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildPersonalTaste, scoreTrailerTaste, createPersonalTasteService } = require('..');
const { buildMoviePrior, buildGuestMoviePrior } = require('../taste/moviePrior');
const { createPersonalTasteReader } = require('../repositories/personalTaste.read');

const NOW = Date.parse('2026-11-10T12:00:00Z');
const iso = (days = 0) => new Date(NOW - days * 86400_000).toISOString();
const item = (movieId, patch = {}) => ({ key: `${movieId}-1`, movieId, trailerId: 1, filterGenre: ['Drama'], filterCountry: ['USA'], actors: ['7'], channelId: 'a', ...patch });
const session = (movieId = 1, patch = {}) => ({ movieId, trailerId: 1, sessionId: 'session_0000000001', durationSec: 60,
  intervals: [[0, 60]], totalPlayedSeconds: 60, realWatchedSeconds: 30, createdAt: iso(), updatedAt: iso(), ...patch });
const reaction = (value, movieId = 1) => ({ type: 'movieTriller', targetId: `${movieId}-1`, value, updatedAt: iso() });
const taste = (input = {}) => buildPersonalTaste({ catalog: [item(1)], nowMs: NOW, ...input });
const value = (profile, dimension, token) => profile.dimensions[dimension].find((row) => row.value === token)?.score || 0;
const prior = () => buildMoviePrior({ nowMs: NOW,
  affinities: [ ['genre', 'Comedy'], ['country', 'Japan'], ['actor', '9'], ['genre_country', 'Japan::Comedy'], ['genre_actor', 'Comedy::9'] ]
    .map(([dimensionType, dimensionValue]) => ({ dimensionType, dimensionValue, affinityScore: 10, updatedAt: iso() })),
  progress: Array.from({ length: 20 }, (_, i) => ({ movieId: i + 100, watchedSeconds: 600, completionRate: 0.5, updatedAt: iso() })),
});

test('uses parent filterGenre/filterCountry/actors and gives equal matching to another channel', () => {
  const catalog = [item(1), item(2, { channelId: 'b' }), item(3, { filterGenre: ['Comedy'], filterCountry: ['Japan'], actors: ['9'] })];
  const profile = taste({ catalog, sessions: [session()] });
  assert.ok(value(profile, 'genre', 'Drama') > 0);
  assert.ok(value(profile, 'country', 'USA') > 0);
  assert.ok(value(profile, 'actor', '7') > 0);
  assert.ok(value(profile, 'genreCountry', '["Drama","USA"]') > 0);
  assert.equal(scoreTrailerTaste(catalog[0], profile).score, scoreTrailerTaste(catalog[1], profile).score);
  assert.ok(scoreTrailerTaste(catalog[1], profile).score > scoreTrailerTaste(catalog[2], profile).score);
});

test('impression and skipping to the final seconds do not establish meaningful interest', () => {
  const profile = taste({ sessions: [session(1, { intervals: [[55, 60]], totalPlayedSeconds: 5, realWatchedSeconds: 2.5 })],
    actions: [{ movieId: 1, trailerId: 1, type: 'impression', eventId: 'event_000000000001', surface: 'home', visibleRatio: 0.5, visibleMs: 1000, occurredAt: iso() }] });
  assert.equal(profile.distinctMeaningfulTrailers, 0);
  assert.equal(profile.hasPersonalTaste, false);
});

test('retries and multiple sessions do not multiply confidence or movie dimension credit', () => {
  const input = { sessions: [session()] };
  const original = taste(input);
  const repeated = taste({ sessions: [session(), session(), session(1, { sessionId: 'session_0000000002' })] });
  assert.equal(original.distinctMeaningfulTrailers, 1);
  assert.equal(repeated.distinctMeaningfulTrailers, 1);
  assert.equal(repeated.effectiveMeaningfulTrailers, 1);
  assert.ok(value(repeated, 'genre', 'Drama') <= 0.25);
});

test('many trailers from the same movie cannot multiply that movie credit', () => {
  const catalog = [item(1), item(1, { key: '1-2', trailerId: 2 })];
  const one = taste({ catalog, sessions: [session()] });
  const two = taste({ catalog, sessions: [session(), session(1, { trailerId: 2 })] });
  assert.deepEqual(two.dimensions, one.dimensions);
  assert.equal(two.positiveMovies, 1);
});

test('actor list length and duplicate metadata do not inflate dimension credit', () => {
  const profile = taste({ catalog: [item(1, { filterGenre: ['Drama', 'Drama'], actors: ['7', '7', '8'] })], sessions: [session()] });
  const totalActors = profile.dimensions.actor.reduce((sum, row) => sum + row.score, 0);
  assert.equal(totalActors, value(profile, 'genre', 'Drama'));
  assert.equal(profile.dimensions.actor.length, 2);
});

test('interest decays with 30-day half-life rather than being renewed on every read', () => {
  const recent = taste({ sessions: [session()] });
  const old = taste({ sessions: [session(1, { createdAt: iso(30) })] });
  assert.ok(Math.abs(value(old, 'genre', 'Drama') / value(recent, 'genre', 'Drama') - 0.5) < 1e-9);
  assert.equal(old.effectiveMeaningfulTrailers, 0.5);
});

test('partial watches across days form a milestone; a later tiny session does not refresh old completion', () => {
  const split = taste({ sessions: [session(1, { createdAt: iso(2), intervals: [[0, 10]], totalPlayedSeconds: 10, realWatchedSeconds: 5 }),
    session(1, { sessionId: 'session_0000000002', createdAt: iso(1), intervals: [[10, 20]], totalPlayedSeconds: 10, realWatchedSeconds: 5 })] });
  assert.equal(split.distinctMeaningfulTrailers, 1);
  const oldSession = session(1, { createdAt: iso(30) });
  const unchanged = taste({ sessions: [oldSession, session(1, { sessionId: 'session_0000000002', intervals: [[0, 1]], totalPlayedSeconds: 1, realWatchedSeconds: 0.5 })] });
  assert.deepEqual(unchanged.dimensions, taste({ sessions: [oldSession] }).dimensions);
});

test('dislike excludes its trailer but does not create negative genre/country/actor cells', () => {
  const profile = taste({ catalog: [item(1), item(2)], sessions: [session(), session(2)], reactions: [reaction('dislike')] });
  assert.deepEqual(profile.excludedTrailerKeys, ['1-1']);
  assert.ok(value(profile, 'genre', 'Drama') > 0);
  assert.equal(scoreTrailerTaste(item(1), profile).score, 0);
  assert.ok(scoreTrailerTaste(item(2), profile).score > 0);
  assert.ok(Object.values(profile.dimensions).flat().every((row) => row.score >= 0));
  assert.equal(taste({ reactions: [reaction('like')] }).hasPersonalTaste, true);
  assert.equal(taste({ reactions: [] }).hasPersonalTaste, false);
});

test('movie prior is confidence-controlled, capped at 35%, and fades as trailer experience grows', () => {
  const moviePrior = prior();
  const cold = taste({ moviePrior });
  assert.equal(cold.sourceShares.moviePrior, 0.35);
  assert.equal(value(cold, 'genre', 'Comedy'), 0.35);
  const growing = taste({ moviePrior, sessions: [session()] });
  assert.ok(growing.sourceShares.moviePrior < cold.sourceShares.moviePrior);
  const catalog = Array.from({ length: 20 }, (_, i) => item(i + 1));
  const mature = taste({ catalog, moviePrior, sessions: catalog.map((row) => session(row.movieId)) });
  assert.equal(mature.sourceShares.moviePrior, 0);
  assert.equal(value(mature, 'genre', 'Comedy'), 0);
  assert.ok(value(mature, 'genre', 'Drama') > 0);
});

test('unproven/missing/stale movie affinities cannot become a strong prior or dilute trailer taste', () => {
  const unproven = buildMoviePrior({ nowMs: NOW, affinities: [{ dimensionType: 'genre', dimensionValue: 'Drama', affinityScore: 10, updatedAt: iso() }] });
  assert.equal(taste({ moviePrior: unproven }).sourceShares.moviePrior, 0);
  const noCells = { confidence: 1, dimensions: {} };
  assert.deepEqual(taste({ sessions: [session()], moviePrior: noCells }).dimensions, taste({ sessions: [session()] }).dimensions);
  const invalid = buildMoviePrior({ nowMs: NOW, affinities: [{ dimensionType: 'genre', dimensionValue: 'Drama', affinityScore: 10, updatedAt: iso(-1) }],
    progress: [{ movieId: 1, watchedSeconds: 999, completionRate: 0.9, updatedAt: iso(200) }] });
  assert.equal(invalid.confidence, 0);
  assert.deepEqual(invalid.dimensions.genre, []);
});

test('existing movie combo conventions are translated without changing the source data', () => {
  const data = prior();
  assert.equal(data.dimensions.genreCountry[0].value, '["Comedy","Japan"]');
  assert.equal(data.dimensions.genreActor[0].value, '["Comedy","9"]');
  const snapshot = JSON.stringify(data);
  taste({ moviePrior: data });
  assert.equal(JSON.stringify(data), snapshot);
});

test('account service scopes every history source and uses only read callbacks', async () => {
  const service = createPersonalTasteService({ readCatalog: async () => [item(1)], readAccountData: async () => ({
    sessions: [{ ...session(), userId: 'alice' }, { ...session(), userId: 'bob' }],
    reactions: [{ ...reaction('dislike'), userId: 'bob' }],
  }) });
  const account = await service.account('alice', { nowMs: NOW });
  assert.equal(account.distinctMeaningfulTrailers, 1);
  assert.deepEqual(account.excludedTrailerKeys, []);
  await assert.rejects(service.account(null), { status: 400 });
});

test('guest personalization stays separate and resolves movie dimensions from server metadata', async () => {
  let accountReads = 0;
  let metadataIds;
  const service = createPersonalTasteService({ readCatalog: async () => [item(1)], readAccountData: async () => { accountReads++; },
    readMovieMetadata: async (ids) => { metadataIds = ids; return [{ id: 9, filterGenre: ['Comedy'], filterCountry: 'Japan', actors: [9] }]; } });
  const guest = await service.guest({ sessions: [session()], movieHistory: [{ m: 9, r: 0.5, t: NOW, filterGenre: ['FAKE'] }] }, { nowMs: NOW });
  assert.equal(accountReads, 0);
  assert.deepEqual(metadataIds, [9]);
  assert.ok(value(guest, 'genre', 'Comedy') > 0);
  assert.equal(value(guest, 'genre', 'FAKE'), 0);
  assert.equal(guest.source, 'guest');
  await assert.rejects(service.guest({ sessions: Array(201).fill(session()) }), { status: 400 });
});

test('guest movie history deduplicates quality films and rejects future/invalid evidence', () => {
  const history = [{ m: 1, r: 0.8, t: NOW }, { m: 1, r: 0.8, t: NOW }, { m: 1, r: 0.8, t: NOW + 1 }];
  const p = buildGuestMoviePrior({ history, movies: [item(1, { id: 1 })], nowMs: NOW });
  assert.equal(p.distinctQualityMovies, 1);
  assert.equal(p.confidence, 1 / 20);
});

test('account reader uses only find/select/lean with user-scoped queries on existing movie models', async () => {
  const queries = [];
  const model = (kind) => ({ find(query) { queries.push({ kind, query }); return { select: () => ({ lean: async () => [] }) }; } });
  const read = createPersonalTasteReader({ actionModel: model('actions'), trailerProgressModel: model('trailers'), reactionModel: model('reactions'),
    movieAffinityModel: model('movieAffinity'), movieProgressModel: model('movieProgress') });
  await read('alice', { nowMs: NOW });
  assert.equal(queries.length, 6);
  assert.ok(queries.every((row) => row.query.userId === 'alice'));
  assert.equal(queries.find((row) => row.kind === 'movieProgress').query.watchedSeconds.$gte, 300);
});

test('empty histories remain neutral and reader failures are not hidden by a fallback', async () => {
  assert.equal(taste().hasPersonalTaste, false);
  const service = createPersonalTasteService({ readCatalog: async () => [], readAccountData: async () => { throw new Error('DB unavailable'); } });
  await assert.rejects(service.account('alice'), /DB unavailable/);
});
