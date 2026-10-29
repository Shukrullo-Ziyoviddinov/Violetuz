'use strict';

const assert = require('node:assert/strict');
const { shortScore } = require('../services/scoring.service');

const score = (overrides) => shortScore({
  completions: 0,
  totalPlayedMs: 5000,
  bestPassRatio: 0,
  liked: false,
  commented: false,
  shared: false,
  ...overrides,
});

assert.equal(score({ completions: 1, bestPassRatio: 1 }), 1.5);
assert.equal(score({ completions: 2, bestPassRatio: 1 }), 3.5);
assert.equal(score({ completions: 2, bestPassRatio: 1, liked: true }), 5.5);
assert.equal(score({ completions: 3, bestPassRatio: 1, liked: true, commented: true }), 9.5);
assert.equal(score({ completions: 4, bestPassRatio: 1, liked: true, commented: true }), 10);
assert.equal(score({ completions: 5, bestPassRatio: 1, liked: true, commented: true, shared: true }), 10);

assert.equal(score({ totalPlayedMs: 100, bestPassRatio: 0.01 }), 0);
assert.equal(score({ totalPlayedMs: 1499, bestPassRatio: 0.01 }), 0);
assert.equal(score({ totalPlayedMs: 1500, bestPassRatio: 0.05 }), -1);
assert.equal(score({ bestPassRatio: 0.1 }), -1);
assert.equal(score({ bestPassRatio: 0.15 }), 0);
assert.equal(score({ bestPassRatio: 0.4 }), 0.5);
assert.equal(score({ bestPassRatio: 0.7 }), 1);

assert.equal(score({ bestPassRatio: 0.2, totalPlayedMs: 2000, liked: true }), 1);
assert.equal(score({ bestPassRatio: 0.1, totalPlayedMs: 2000, liked: true }), 0);
assert.equal(score({ bestPassRatio: 0.8, liked: true }), 3);
assert.equal(score({ bestPassRatio: 0.5, commented: true, shared: true }), 6.5);

assert.equal(shortScore({}), 0);

console.log('ok scoring');
