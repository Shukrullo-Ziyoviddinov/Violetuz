'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cookieParser = require('cookie-parser');
const { createGuestIdentity } = require('../guest/guestIdentity');
const { createGuestProgressRouter } = require('../routes/guestProgress.routes');
const { createProgressService } = require('../services/progress.service');
const { createTrendingService } = require('../services/trending.service');

const initial = { movieId: 1, trailerId: 2, sessionId: 'guest_session_00000001', durationSec: 60 };
const report = (patch = {}) => ({ ...initial, intervals: [[0, 30]], realWatchedSeconds: 30, totalPlayedSeconds: 30, ...patch });

test('guest identity signatures, token scope, elapsed time, identity binding and expiration are enforced', () => {
  let now = Date.now();
  const identity = createGuestIdentity({ secret: 'guest-test-secret', now: () => now });
  const a = identity.issue();
  const b = identity.issue();
  assert.equal(identity.read(a.token), a.guestId);
  assert.equal(identity.read(a.token + 'x'), null);
  const ticket = identity.start(a.guestId, initial);
  assert.equal(identity.read(ticket), null);
  assert.throws(() => identity.validate(a.guestId, report({ ticket })), /elapsed/);
  now += 30000;
  assert.equal(identity.validate(a.guestId, report({ ticket, userId: 'forged' })).totalPlayedSeconds, 30);
  assert.throws(() => identity.validate(b.guestId, report({ ticket })), /identity/);
  assert.throws(() => identity.validate(a.guestId, report({ ticket, trailerId: 9 })), /identity/);
  assert.throws(() => identity.validate(a.guestId, report({ ticket: a.token })), /audience/);
  now += 7 * 3600000;
  assert.throws(() => identity.validate(a.guestId, report({ ticket })), /expired/);
});

test('guest HTTP playback reaches global trending once per anonymous viewer, stays separate and rejects invalid ingestion', async () => {
  let now = Date.now();
  const rows = [];
  const matches = (row, query) => Object.entries(query).every(([key, value]) => row[key] === value);
  const model = {
    findOne: (query) => ({ lean: async () => rows.find((row) => matches(row, query)) || null }),
    create: async (row) => { rows.push({ ...row, createdAt: new Date(now), updatedAt: new Date(now) }); },
    findOneAndUpdate: (query, update) => ({ lean: async () => {
      const row = rows.find((entry) => matches(entry, query));
      if (!row) return null;
      Object.assign(row, update.$set, { version: row.version + 1, updatedAt: new Date(now) });
      return row;
    } }),
  };
  const movieModel = { findOne: (query) => ({ select: () => ({ lean: async () =>
    query.id === 1 && query['trailersVideo.id'] === 2 ? { id: 1 } : null }) }) };
  const identity = createGuestIdentity({ secret: 'guest-http-secret', now: () => now });
  const app = express();
  app.use(express.json()); app.use(cookieParser());
  app.use('/guest', createGuestProgressRouter({ identity, movieModel, origins: ['https://allowed.test'],
    progressService: createProgressService({ movieModel, progressModel: model }) }));
  app.use((error, req, res, next) => res.status(error.status || 500).json({ success: false, message: error.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/guest`;
  const post = (path, body, headers = {}) => fetch(`${url}${path}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  try {
    assert.equal((await post('', report())).status, 400);
    assert.equal((await post('/session', initial, { Cookie: 'violet_auth=account-cookie' })).status, 409);
    assert.equal((await post('/session', initial, { Origin: 'https://evil.test' })).status, 403);
    assert.equal((await post('/session', { ...initial, movieId: 999 })).status, 400);
    let firstCookie;
    for (let index = 0; index < 3; index++) {
      const started = await post('/session', initial);
      assert.equal(started.status, 200);
      const cookieHeader = started.headers.get('set-cookie');
      assert.match(cookieHeader, /HttpOnly/i);
      const cookie = cookieHeader.split(';')[0];
      firstCookie ||= cookie;
      const { data: { ticket } } = await started.json();
      assert.equal((await post('', report({ ticket }), { Cookie: cookie })).status, 400);
      now += 30000;
      const accepted = await post('', report({ ticket, userId: 'spoofed-account', createdAt: '2000-01-01' }), { Cookie: cookie });
      assert.equal(accepted.status, 200);
      assert.equal((await accepted.json()).data.changed, true);
      const duplicate = await post('', report({ ticket }), { Cookie: cookie });
      assert.equal((await duplicate.json()).data.changed, false);
      const stable = await post('/session', { ...initial, sessionId: 'another_session_000001' }, { Cookie: cookie });
      assert.equal(stable.headers.get('set-cookie'), null);
      const stableTicket = (await stable.json()).data.ticket;
      now += 30000;
      assert.equal((await post('', report({ sessionId: 'another_session_000001', ticket: stableTicket }), { Cookie: cookie })).status, 200);
      if (index > 0) assert.equal((await post('', report({ ticket }), { Cookie: firstCookie })).status, 400);
    }
    assert.equal(rows.length, 6);
    assert.equal(new Set(rows.map((row) => row.userId)).size, 3);
    assert.ok(rows.every((row) => row.userId !== 'spoofed-account' && row.createdAt.getFullYear() !== 2000));
    const service = createTrendingService({ readCatalog: async () => [{ key: '1-2', movieId: 1, trailerId: 2 }],
      readAccounts: async () => ({ sessions: [], actions: [], reactions: [] }),
      readTrustedGuests: async () => ({ sessions: rows, actions: [], reactions: [] }) });
    const result = await service.compute({ nowMs: now });
    assert.equal(result.sources.guests, 'verified-reader');
    assert.equal(result.trailers[0].distinctViewers, 3);
    assert.equal(result.trailers[0].distinctMeaningfulViewers, 3);
    assert.ok(result.trailers[0].score > 0);
    let throttled = false;
    for (let index = 0; index < 11; index++) {
      if ((await post('/session', initial)).status === 429) throttled = true;
    }
    assert.equal(throttled, true, 'repeated anonymous identity creation must be throttled by IP');
  } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
});

test('guest trend reader uses server receipt dates from the isolated guest collection', async () => {
  const { createGuestTrendReader } = require('../repositories/guestTrailerTrend.read');
  let query;
  const chain = { select() { return chain; }, lean: async () => [{ userId: 'guest-hash' }] };
  const read = createGuestTrendReader({ progressModel: { find: (filter) => { query = filter; return chain; } } });
  const result = await read({ fromMs: 1000, nowMs: 2000 });
  assert.equal(query.createdAt.$gte.getTime(), 1000);
  assert.equal(query.createdAt.$lte.getTime(), 2000);
  assert.equal(query.updatedAt.$lte.getTime(), 2000);
  assert.deepEqual(result, { sessions: [{ userId: 'guest-hash' }], actions: [], reactions: [] });
});
