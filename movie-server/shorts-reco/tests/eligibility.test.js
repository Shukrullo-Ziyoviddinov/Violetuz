'use strict';

const assert = require('node:assert/strict');
const { seenStatus, orderRepeats, canRepeat } = require('../services/eligibility.service');

const now = new Date('2026-08-10T00:00:00.000Z');
const day = 24 * 60 * 60 * 1000;
const at = (daysAgo) => new Date(now.getTime() - daysAgo * day);

assert.equal(seenStatus(null, now), 'unseen');
assert.equal(seenStatus({ lastSeenAt: at(1) }, now), 'blocked');
assert.equal(seenStatus({ lastSeenAt: at(3) }, now), 'repeat');

const watches = new Map([
  ['liked', { lastSeenAt: at(10), liked: true, commented: false }],
  ['newer', { lastSeenAt: at(9), liked: false, commented: false }],
  ['oldest', { lastSeenAt: at(20), liked: false, commented: false }],
  ['recent', { lastSeenAt: at(1), liked: false, commented: false }],
]);
const ordered = orderRepeats(
  [{ shortId: 'liked' }, { shortId: 'newer' }, { shortId: 'oldest' }],
  watches
);
assert.deepEqual(ordered.map((doc) => doc.shortId), ['oldest', 'newer', 'liked']);
assert.equal(seenStatus(watches.get('recent'), now), 'blocked');

assert.equal(canRepeat({ anchorIsTop2: false, unseenRemaining: false, repeatsUsed: 0 }), false);
assert.equal(canRepeat({ anchorIsTop2: true, unseenRemaining: true, repeatsUsed: 0 }), false);
assert.equal(canRepeat({ anchorIsTop2: true, unseenRemaining: false, repeatsUsed: 2 }), false);
assert.equal(canRepeat({ anchorIsTop2: true, unseenRemaining: false, repeatsUsed: 1 }), true);

console.log('ok eligibility');
