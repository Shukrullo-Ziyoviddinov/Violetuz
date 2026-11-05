'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createFeedRouter } = require('../routes/feed.routes');

test('feed HTTP contract: identity, guest bounds, private presentation and server seed', async () => {
  const calls = [];
  const result = { generatedAt: '2026-11-05T00:00:00.000Z', items: [{ key: '12-3', movieId: 12,
    trailerId: 3, title: { uz: 'Trailer' }, trillerimg: '/image.jpg', trailers: 'private-video', sourceScore: 1 }] };
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/feed', createFeedRouter({
    authenticate: (req, res, next) => { if (!req.headers['x-test-account']) return res.sendStatus(401);
      req.authUser = { _id: 'actual-account' }; next(); },
    account: async (...args) => { calls.push(['account', ...args]); return result; },
    guest: async (...args) => { calls.push(['guest', ...args]); return result; },
  }));
  app.use((error, req, res, next) => res.status(error.status || 500).json({ message: error.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/feed`;
  try {
    assert.equal((await fetch(url)).status, 401);
    const response = await fetch(`${url}?userId=other`, { headers: { 'x-test-account': 'yes' } });
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    const body = await response.json();
    assert.equal(body.data.items[0].id, 3);
    assert.equal(body.data.items[0].trailers, undefined);
    assert.equal(body.data.items[0].sourceScore, undefined);
    assert.equal(calls[0][1], 'actual-account');
    assert.match(calls[0][2].sessionSeed, /^[a-f0-9]{48}$/);
    const post = (data) => fetch(`${url}/guest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    assert.equal((await post({ userId: 'other', reactions: ['fake-like'] })).status, 200);
    assert.deepEqual(calls[1][1], { sessions: [], actions: [], movieHistory: [] });
    assert.equal((await post({ sessions: Array(201).fill({}) })).status, 400);
    assert.equal((await post({ actions: {} })).status, 400);
    assert.equal((await post([])).status, 400);
    assert.equal(calls.length, 2);
  } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
});
