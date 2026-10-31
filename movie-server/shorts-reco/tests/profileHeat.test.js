'use strict';

const assert = require('node:assert/strict');
const { ACTIVITY, activityScore } = require('../services/profileHeat/heat');

const near = (actual, expected) => {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} !== ${expected}`);
};

const row = (day, likes, comments, rewatches) => ({ day, likes, comments, rewatches });

assert.equal(ACTIVITY.like, 1);
assert.equal(ACTIVITY.comment, 1);
assert.equal(ACTIVITY.rewatch, 1);
assert.equal(ACTIVITY.dailyDecay, 0.85);
assert.equal(ACTIVITY.windowDays, 30);

const now = new Date('2026-10-31T18:00:00.000Z');
const today = [row('2026-10-31', 4, 2, 1)];
assert.equal(activityScore(today, now), 7);

const tenDaysAgo = [row('2026-10-21', 10, 0, 0)];
near(activityScore(tenDaysAgo, now), 10 * (0.85 ** 10));
assert.ok(activityScore(tenDaysAgo, now) < activityScore([row('2026-10-31', 10, 0, 0)], now));

const monthsAgo = [row('2026-08-01', 1000, 500, 500)];
assert.equal(activityScore(monthsAgo, now), 0);
assert.ok(activityScore([row('2026-10-31', 1, 0, 0)], now) > activityScore(monthsAgo, now));

const peakDays = [row('2026-10-01', 10, 0, 0)];
const peak = activityScore(peakDays, new Date('2026-10-01T12:00:00.000Z'));
const fallen = activityScore(peakDays, new Date('2026-10-11T12:00:00.000Z'));
assert.equal(peak, 10);
assert.ok(fallen < peak);
near(fallen, 10 * (0.85 ** 10));

const returned = activityScore(
  [row('2026-10-01', 10, 0, 0), row('2026-10-11', 4, 1, 0)],
  new Date('2026-10-11T12:00:00.000Z')
);
assert.ok(returned > fallen);
near(returned, fallen + 5);

const evening = activityScore([row('2026-10-31', 5, 0, 0)], new Date('2026-10-31T23:00:00.000Z'));
const nextMorning = activityScore([row('2026-10-31', 5, 0, 0)], new Date('2026-11-01T00:00:00.000Z'));
assert.equal(evening, 5);
near(nextMorning, 5 * 0.85);

assert.equal(activityScore([], now), 0);
assert.equal(activityScore(null, now), 0);
assert.equal(activityScore(today, null), 0);
assert.equal(activityScore([row('2026-11-01', 9, 0, 0)], now), 0);
assert.equal(activityScore([{ day: '2026-02-31', likes: 3, comments: 0, rewatches: 0 }], now), 0);

console.log('ok profileHeat');
