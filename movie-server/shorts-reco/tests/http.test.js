'use strict';

const assert = require('node:assert/strict');
const express = require('express');
const collections = require('../config/collections');
const { matches } = require('../services/feed/sources/match');
const { createShortsRecoModule } = require('../index');

/**
 * @param {unknown} value
 */
const clone = (value) => {
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map(clone);
  if (value && typeof value === 'object') {
    const copy = {};
    Object.keys(value).forEach((key) => {
      copy[key] = clone(value[key]);
    });
    return copy;
  }
  return value;
};

/**
 * @param {object[]} list
 * @param {object} spec
 */
const sortRows = (list, spec) => {
  const fields = Object.entries(spec || {});
  return list.slice().sort((left, right) => {
    for (let i = 0; i < fields.length; i += 1) {
      const [field, direction] = fields[i];
      const sign = direction < 0 ? -1 : 1;
      const a = left[field];
      const b = right[field];
      if (a == null && b == null) continue;
      if (a == null) return 1;
      if (b == null) return -1;
      if (a > b) return sign;
      if (a < b) return -sign;
    }
    return 0;
  });
};

/**
 * Enough of the driver for one feed request and one watch event.
 */
const createMemoryConnection = () => {
  const tables = new Map();
  const rowsOf = (name) => {
    if (!tables.has(name)) tables.set(name, []);
    return tables.get(name);
  };

  const collection = (name) => {
    const rows = rowsOf(name);
    return {
      async createIndex() {},
      async insertOne(doc) {
        if (doc.eventId && rows.some((row) => row.eventId === doc.eventId)) {
          const error = new Error('duplicate key');
          error.code = 11000;
          throw error;
        }
        rows.push(clone(doc));
      },
      async deleteOne(filter) {
        const index = rows.findIndex((row) => matches(row, filter));
        if (index >= 0) rows.splice(index, 1);
      },
      async findOne(filter) {
        const found = rows.find((row) => matches(row, filter));
        return found ? clone(found) : null;
      },
      find(filter) {
        const state = { list: rows.filter((row) => matches(row, filter || {})).map(clone) };
        const cursor = {
          sort(spec) {
            state.list = sortRows(state.list, spec);
            return cursor;
          },
          limit(size) {
            state.list = state.list.slice(0, size);
            return cursor;
          },
          toArray() {
            return Promise.resolve(state.list.map(clone));
          },
        };
        return cursor;
      },
      async replaceOne(filter, doc, options) {
        const index = rows.findIndex((row) => matches(row, filter));
        if (index >= 0) rows[index] = clone(doc);
        else if (options && options.upsert) rows.push(clone(doc));
      },
      async updateOne(filter, update, options) {
        let doc = rows.find((row) => matches(row, filter));
        if (!doc) {
          if (!options || !options.upsert) return;
          doc = clone(update.$setOnInsert || {});
          rows.push(doc);
        }
        Object.entries(update.$inc || {}).forEach(([key, amount]) => {
          doc[key] = (doc[key] || 0) + amount;
        });
        Object.assign(doc, update.$set || {});
      },
    };
  };

  return { collection, rowsOf };
};

const catalogRow = (type, id, artistId, at) => ({
  shortId: `${type}:${id}`,
  type,
  contentType: type === 'musicshorts' ? 'music' : null,
  movieId: type === 'movieShorts' ? id : null,
  musicKey: null,
  songGroupId: null,
  artistId,
  movieGenres: [],
  movieTypeCategories: [],
  movieCountries: [],
  musicGenres: [],
  musicCountries: [],
  actors: [],
  franchiseMovieIds: [],
  catalogAddedAt: new Date(at),
});

const seed = (db) => {
  const catalog = db.rowsOf(collections.reco.shortCatalog);
  const movies = db.rowsOf(collections.existing.shortsVideos.name);
  const music = db.rowsOf(collections.existing.musicShorts.name);
  [
    [1, 'a', '2026-03-01'],
    [2, 'b', '2026-02-01'],
    [3, 'c', '2026-01-01'],
  ].forEach(([id, artistId, at]) => {
    catalog.push(catalogRow('movieShorts', id, artistId, at));
    movies.push({ id, type: 'movieShorts', movieId: id, video: `movie-${id}` });
  });
  [
    [11, 'd', '2026-03-02'],
    [12, 'e', '2026-02-02'],
    [13, 'f', '2026-01-02'],
  ].forEach(([id, artistId, at]) => {
    catalog.push(catalogRow('musicshorts', id, artistId, at));
    music.push({ id, type: 'musicshorts', artistId, video: `music-${id}` });
  });
};

/**
 * @param {import('http').Server} server
 * @param {string} method
 * @param {string} path
 * @param {{ userId?: string, body?: object }} [options]
 */
const request = async (server, method, path, options = {}) => {
  const headers = {};
  if (options.userId) headers['x-user-id'] = options.userId;
  let body;
  if (options.body) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(options.body);
  }
  const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method,
    headers,
    body,
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
};

const eventBody = (eventId, shortId) => ({
  eventId,
  shortId,
  passRatio: 0.95,
  playedMsDelta: 4000,
});

const main = async () => {
  const db = createMemoryConnection();
  seed(db);
  const reco = createShortsRecoModule({
    connection: db,
    logger: { info() {}, warn() {}, error() {} },
    authMiddleware: (req, _res, next) => {
      const userId = req.headers['x-user-id'];
      req.authUser = userId ? { _id: userId } : null;
      next();
    },
  });

  const app = express();
  app.use(express.json());
  app.use('/api/shorts-reco', reco.router);
  app.use((error, _req, res, _next) => {
    res.status(error.status || 500).json({ success: false, message: error.message });
  });

  const server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });

  try {
    const ignored = await request(server, 'POST', '/api/shorts-reco/events', {
      body: eventBody('11111111-1111-4111-8111-111111111111', 1),
    });
    assert.equal(ignored.status, 204);
    assert.equal(ignored.body, null);

    const invalid = await request(server, 'POST', '/api/shorts-reco/events', {
      userId: 'user-1',
      body: { eventId: 'not-a-uuid', shortId: 1, passRatio: 2, playedMsDelta: -1 },
    });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.success, false);
    assert.ok(invalid.body.errors.length >= 2);

    const missing = await request(server, 'POST', '/api/shorts-reco/events', {
      userId: 'user-1',
      body: eventBody('22222222-2222-4222-8222-222222222222', 99999),
    });
    assert.equal(missing.status, 404);

    const accepted = await request(server, 'POST', '/api/shorts-reco/events', {
      userId: 'user-1',
      body: eventBody('33333333-3333-4333-8333-333333333333', 1),
    });
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.success, true);
    assert.equal(accepted.body.shortId, 'movieShorts:1');
    assert.ok(accepted.body.score >= 1);

    const duplicate = await request(server, 'POST', '/api/shorts-reco/events', {
      userId: 'user-1',
      body: eventBody('33333333-3333-4333-8333-333333333333', 1),
    });
    assert.equal(duplicate.status, 204);

    const badQuery = await request(server, 'GET', '/api/shorts-reco/feed?position=-1');
    assert.equal(badQuery.status, 400);

    const feed = await request(server, 'GET', '/api/shorts-reco/feed');
    assert.equal(feed.status, 200);
    assert.equal(feed.body.success, true);
    assert.ok(feed.body.sessionId);
    assert.equal(feed.body.frozenUntil, 3);
    assert.ok(feed.body.items.length >= 4);
    for (let i = 1; i < feed.body.items.length; i += 1) {
      assert.notEqual(feed.body.items[i].type, feed.body.items[i - 1].type);
    }
    const played = feed.body.items.find((item) => item.shortId === 'movieShorts:1')
      || feed.body.items.find((item) => item.type === 'movieShorts');
    assert.equal(played.short.video, `movie-${played.short.id}`);

    const again = await request(
      server,
      'GET',
      `/api/shorts-reco/feed?sessionId=${feed.body.sessionId}&position=0`
    );
    assert.equal(again.status, 200);
    assert.deepEqual(
      again.body.items.slice(0, 4).map((item) => item.shortId),
      feed.body.items.slice(0, 4).map((item) => item.shortId)
    );

    const personal = await request(server, 'GET', '/api/shorts-reco/feed', { userId: 'user-1' });
    assert.equal(personal.status, 200);
    assert.ok(personal.body.items.length >= 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  console.log('ok http');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
