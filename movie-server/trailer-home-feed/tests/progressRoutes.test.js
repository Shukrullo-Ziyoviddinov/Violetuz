'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createProgressRouter } = require('../routes/progress.routes');

test('queued progress cannot be saved using another account cookie; matching and legacy requests still work', async () => {
  const calls = [];
  const app = express();
  app.use(express.json());
  app.use('/progress', createProgressRouter({
    authenticate: (req, res, next) => { req.authUser = { _id: 'account-b' }; next(); },
    progressService: { report: async (...args) => { calls.push(args); return { changed: true }; } },
  }));
  app.use((error, req, res, next) => res.status(error.status || 500).json({ success: false, message: error.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/progress`;
  const post = (body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.equal((await post({ expectedAccountId: 'account-a' })).status, 400);
    assert.equal(calls.length, 0);
    const matched = await post({ expectedAccountId: 'account-b' });
    assert.equal(matched.status, 200);
    assert.equal((await matched.json()).success, true);
    assert.equal(calls[0][0], 'account-b');
    assert.equal((await post({})).status, 200);
    assert.equal(calls.length, 2);
  } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
});
