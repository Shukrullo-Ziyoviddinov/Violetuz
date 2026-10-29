'use strict';

const assert = require('node:assert/strict');
const { levelFor, buildCycle, buildSlotPlan } = require('../services/feed/slotPlan');

assert.equal(levelFor(1.9).name, 'weak');
assert.equal(levelFor(2).name, 'medium');
assert.equal(levelFor(4.9).name, 'medium');
assert.equal(levelFor(5).name, 'strong');
assert.equal(levelFor(7.9).name, 'strong');
assert.equal(levelFor(8).name, 'veryStrong');

const actorSlots = { weak: 0, medium: 0, strong: 1, veryStrong: 2 };

['weak', 'medium', 'strong', 'veryStrong'].forEach((name) => {
  ['movie', 'music'].forEach((dominant) => {
    const cycle = buildCycle({ level: name, dominant, actorSlots: actorSlots[name] });
    assert.equal(cycle.length, 10, `${name} ${dominant}`);
    assert.ok(cycle.filter((slot) => slot.source === 'explore').length >= 1);
  });
});

const weak = buildCycle({ level: 'weak', dominant: 'movie', actorSlots: 0 });
assert.equal(weak.filter((slot) => slot.source === 'sameMovie').length, 1);
assert.equal(weak.filter((slot) => slot.source === 'similar').length, 2);
assert.equal(weak.filter((slot) => slot.source === 'explore').length, 2);
assert.equal(weak.filter((slot) => slot.source === 'profile').length, 5);

const strong = buildCycle({ level: 'strong', dominant: 'movie', actorSlots: 1 });
assert.equal(strong.filter((slot) => slot.source === 'similar').length, 1);
assert.equal(strong.filter((slot) => slot.source === 'actor').length, 1);

const veryStrong = buildCycle({ level: 'veryStrong', dominant: 'music', actorSlots: 2 });
assert.equal(veryStrong.filter((slot) => slot.source === 'sameArtist').length, 4);
assert.equal(veryStrong.filter((slot) => slot.source === 'sameMusic').length, 1);
assert.equal(veryStrong.filter((slot) => slot.source === 'similar').length, 1);
assert.equal(veryStrong.filter((slot) => slot.source === 'actor').length, 2);
assert.equal(veryStrong.filter((slot) => slot.source === 'explore').length, 1);

assert.equal(buildSlotPlan({ strength: 0, dominant: 'movie', actorSlots: 0 }).slots.length, 20);

console.log('ok slotPlan');
