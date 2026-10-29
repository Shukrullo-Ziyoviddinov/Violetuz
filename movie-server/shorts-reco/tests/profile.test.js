'use strict';

const assert = require('node:assert/strict');
const { DAY_MS } = require('../utils/time');
const {
  emptyProfile,
  decayProfile,
  applyScoreChange,
  pushSession,
} = require('../services/profile.service');
const { freshnessBonus, popularityBonus } = require('../services/affinity.service');

const near = (actual, expected) => {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} !== ${expected}`);
};

const now = new Date('2026-10-29T12:00:00.000Z');
const profile = emptyProfile('user-1', new Date(now.getTime() - DAY_MS));
profile.longTerm.movies['m:4'] = 100;
const factor = decayProfile(profile, now);
near(factor, 0.97);
near(profile.longTerm.movies['m:4'], 97);

const weights = emptyProfile('user-1', now);
applyScoreChange(weights, {
  type: 'movieShorts',
  movieId: 4,
  movieGenres: ['a', 'b'],
  movieTypeCategories: ['c'],
  movieCountries: ['usa', 'britain'],
}, 0, 1.5, 1);
near(weights.longTerm.genres['g:a'], 0.3);
near(weights.longTerm.genres['g:b'], 0.3);
near(weights.longTerm.genres['g:c'], 0.15);
near(weights.longTerm.countries['c:usa'], 0.225);
near(weights.longTerm.countries['c:britain'], 0.225);
near(weights.longTerm.movieEngagementRaw['4'], 1.5);

const skipped = emptyProfile('user-1', now);
const movie = {
  type: 'movieShorts',
  movieId: 4,
  movieGenres: ['jangari'],
  movieTypeCategories: [],
  movieCountries: ['usa'],
};
applyScoreChange(skipped, movie, 0, -1, 1);
near(skipped.longTerm.movies['m:4'], -0.5);
near(skipped.longTerm.genres['g:jangari'], -0.5);
applyScoreChange(skipped, movie, -1, 1.5, 1);
near(skipped.longTerm.movies['m:4'], 1.5);
near(skipped.longTerm.genres['g:jangari'], 0.75);
near(skipped.longTerm.movieEngagementRaw['4'], 1.5);

const music = emptyProfile('user-1', now);
applyScoreChange(music, {
  type: 'musicshorts',
  movieId: 9,
  artistId: 'jah-khalib',
  musicKey: 'music:802',
  musicGenres: ['pop'],
  musicCountries: ['uzbekistan'],
}, 0, 1.5, 1);
near(music.longTerm.movies['m:9'], 0.6);
assert.equal(music.longTerm.movieEngagementRaw['9'], undefined);
near(music.longTerm.artists['a:jah-khalib'], 1.5);

let session = { items: [] };
for (let id = 1; id <= 13; id += 1) {
  session = pushSession(session, { shortId: `movieShorts:${id}`, score: id, refs: {}, ts: now });
}
assert.equal(session.items.length, 12);
assert.equal(session.items[0].shortId, 'movieShorts:2');
assert.equal(session.items[11].shortId, 'movieShorts:13');
session = pushSession(session, { shortId: 'movieShorts:13', score: 99, refs: {}, ts: now });
assert.equal(session.items.length, 12);
assert.equal(session.items[11].score, 99);

near(freshnessBonus({ catalogAddedAt: now }, now), 0.15);
assert.equal(freshnessBonus({ catalogAddedAt: new Date(now.getTime() - 8 * DAY_MS) }, now), 0);
assert.equal(popularityBonus({ views: 0 }), 0);
assert.equal(popularityBonus({ views: 1000000 }), 0.15);

console.log('ok profile');
