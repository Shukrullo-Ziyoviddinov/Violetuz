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

test('HTTP continuation retains account scope and passes previously shown identities to the existing ranker', async () => {
  const items = Array.from({ length: 85 }, (_, i) => ({ key: `${i + 1}-1`, movieId: i + 1, trailerId: 1 }));
  const calls = [];
  const rank = async (viewer, options) => {
    calls.push({ viewer, ...options });
    return { items: items.filter((item) => !options.excludeKeys.includes(item.key)).slice(0, 40) };
  };
  const app = express();
  app.use(express.json());
  app.use('/feed', createFeedRouter({ account: rank, guest: (history, options) => rank('guest', options),
    authenticate: (req, res, next) => { req.authUser = { _id: req.get('x-test-account') || 'a' }; next(); } }));
  app.use((error, req, res, next) => res.status(error.status || 500).json({ message: error.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/feed`;
  try {
    const first = (await (await fetch(url)).json()).data;
    assert.equal(first.items.length, 40);
    assert.ok(first.nextCursor);
    const nextUrl = `${url}?cursor=${encodeURIComponent(first.nextCursor)}`;
    assert.equal((await fetch(nextUrl, { headers: { 'x-test-account': 'b' } })).status, 410);
    assert.equal((await fetch(`${url}/guest?cursor=${encodeURIComponent(first.nextCursor)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 410);
    const second = (await (await fetch(nextUrl)).json()).data;
    const retry = (await (await fetch(nextUrl)).json()).data;
    assert.deepEqual(second, retry);
    const third = (await (await fetch(`${url}?cursor=${encodeURIComponent(second.nextCursor)}`)).json()).data;
    assert.equal(third.nextCursor, null);
    assert.equal(new Set([...first.items, ...second.items, ...third.items].map((item) => item.key)).size, 85);
    assert.equal(calls.length, 3);
    assert.equal(calls[1].excludeKeys.length, 40);
    assert.equal(calls[2].excludeKeys.length, 80);
    assert.equal(calls[0].sessionSeed, calls[2].sessionSeed);
  } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
});

test('a small window slices the stored page and does not rank again or shrink the rank', async () => {
  const items = Array.from({ length: 40 }, (_, i) => ({ key: `${i + 1}-1`, movieId: i + 1, trailerId: 1 }));
  const calls = [];
  const rank = async (viewer, options) => {
    calls.push(options);
    return { items: items.slice(0, options.limit) };
  };
  const app = express();
  app.use(express.json());
  app.use('/feed', createFeedRouter({ account: rank, guest: rank,
    authenticate: (req, res, next) => { req.authUser = { _id: 'a' }; next(); } }));
  app.use((error, req, res, next) => res.status(error.status || 500).json({ message: error.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/feed`;
  try {
    const first = (await (await fetch(`${url}?offset=0&limit=4`)).json()).data;
    assert.equal(first.items.map((item) => item.key).join(','), '1-1,2-1,3-1,4-1');
    assert.equal(first.hasMore, true);
    assert.equal(first.nextOffset, 4);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].limit, 40);
    const second = (await (await fetch(`${url}?cursor=${encodeURIComponent(first.pageCursor)}&offset=4&limit=4`)).json()).data;
    assert.equal(second.items[0].key, '5-1');
    assert.equal(second.pageCursor, first.pageCursor);
    assert.equal(calls.length, 1);
    const full = (await (await fetch(`${url}?cursor=${encodeURIComponent(first.pageCursor)}`)).json()).data;
    assert.equal(full.items.length, 40);
    assert.equal(full.items[0].key, '1-1');
    assert.equal(calls.length, 1);
  } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
});
