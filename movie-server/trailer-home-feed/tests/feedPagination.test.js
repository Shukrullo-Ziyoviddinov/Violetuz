'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createFeedPagination } = require('../services/feedPagination');

test('one seeded ordering continues past candidate limits without duplicates; retries reuse the exact page', async () => {
  const paginate = createFeedPagination();
  const catalog = Array.from({ length: 455 }, (_, i) => ({ key: `${i + 1}-1`, movieId: i + 1, trailerId: 1 }));
  const calls = [];
  const rank = async (options) => {
    calls.push(options);
    return { items: catalog.filter((item) => !options.excludeKeys.includes(item.key)).slice(0, options.limit) };
  };
  let page = await paginate({ scope: 'account:a', rank });
  const seen = [...page.items];
  const cursor = page.nextCursor;
  const [a, b] = await Promise.all([paginate({ cursor, scope: 'account:a', rank }), paginate({ cursor, scope: 'account:a', rank })]);
  assert.deepEqual(a, b);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1].previousItems.map((item) => item.key), catalog.slice(31, 40).map((item) => item.key));
  assert.deepEqual(await paginate({ cursor, scope: 'account:a', rank }), a);
  page = a;
  seen.push(...page.items);
  while (page.nextCursor) { page = await paginate({ cursor: page.nextCursor, scope: 'account:a', rank }); seen.push(...page.items); }
  assert.equal(seen.length, 455);
  assert.equal(new Set(seen.map((item) => item.key)).size, 455);
  assert.equal(new Set(calls.map((call) => call.sessionSeed)).size, 1);
  await paginate({ scope: 'account:a', rank });
  assert.notEqual(calls.at(-1).sessionSeed, calls[0].sessionSeed);
});

test('cursor scope, expiration, validation and bounded session eviction are enforced', async () => {
  let now = 1000;
  const paginate = createFeedPagination({ now: () => now, maxSessions: 1 });
  const rank = async () => ({ items: Array.from({ length: 40 }, (_, i) => ({ key: `${i}-1` })) });
  const page = await paginate({ scope: 'account:a', rank });
  await assert.rejects(paginate({ cursor: page.nextCursor, scope: 'account:b', rank }), { status: 410 });
  await assert.rejects(paginate({ cursor: page.nextCursor, scope: 'guest', rank }), { status: 410 });
  await assert.rejects(paginate({ cursor: 'invalid', scope: 'account:a', rank }), { status: 400 });
  await paginate({ scope: 'account:a', rank });
  await assert.rejects(paginate({ cursor: page.nextCursor, scope: 'account:a', rank }), { status: 410 });
  const newer = await paginate({ scope: 'guest', rank });
  now += 31 * 60000;
  await assert.rejects(paginate({ cursor: newer.nextCursor, scope: 'guest', rank }), { status: 410 });
});
