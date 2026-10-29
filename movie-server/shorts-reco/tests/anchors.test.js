'use strict';

const assert = require('node:assert/strict');
const { dominantFamily, planAnchors } = require('../services/anchors.service');

const movie = (movieId, score, ts) => ({
  score,
  ts,
  refs: { type: 'movieShorts', movieId },
});

const music = (musicKey, score, ts) => ({
  score,
  ts,
  refs: { type: 'musicshorts', musicKey, artistId: null },
});

const weak = planAnchors({
  items: [movie(1, 0.2, '2026-01-01')],
});
assert.equal(weak.active.length, 0);

const crowded = planAnchors({
  items: [1, 2, 3, 4].map((id) => movie(id, 5, `2026-01-0${id}`)),
});
assert.equal(crowded.active.length, 3);
assert.ok(crowded.active.every((row) => row.strength >= 1));

assert.equal(dominantFamily([
  music('music:1', 2, '2026-03-01'),
  music('music:2', 2, '2026-03-02'),
  music('music:3', 2, '2026-03-03'),
]), 'music');

const older = [1, 2, 3].map((id) => movie(id, 10, `2026-01-0${id}`));
const recent = [1, 2, 3].map((id) => music('music:5', 1, `2026-02-0${id}`));
const shifted = planAnchors({ items: older.concat(recent) });
assert.equal(shifted.active[0].key, 'mk:music:5');
assert.equal(shifted.multipliers['m:1'], 0.5);
assert.equal(shifted.multipliers['m:2'], 0.5);
assert.equal(shifted.pinned, 'mk:music:5');

const again = planAnchors({
  items: older.concat(recent),
  multipliers: shifted.multipliers,
  locks: shifted.locks,
  fatigue: shifted.fatigue,
  pinned: shifted.pinned,
});
assert.equal(again.multipliers['m:1'], 0.5);
assert.equal(again.multipliers['m:2'], 0.5);
assert.equal(again.active[0].key, 'mk:music:5');

const reset = planAnchors({
  items: older.concat(recent, [movie(1, 1, '2026-03-01')]),
  multipliers: shifted.multipliers,
  locks: shifted.locks,
  fatigue: shifted.fatigue,
  pinned: shifted.pinned,
});
assert.equal(reset.multipliers['m:1'], 1);
assert.equal(reset.multipliers['m:2'], 0.5);

const tired = [0.5, 0.4, 0.6, 0.5].map((bestPassRatio) => ({
  anchorKey: 'm:1',
  bestPassRatio,
}));
const fatigued = planAnchors({
  items: [movie(1, 2, '2026-01-01')],
  served: tired,
  now: new Date('2026-04-01T00:00:00Z'),
});
assert.equal(fatigued.multipliers['m:1'], 0.5);
assert.equal(fatigued.fatigue['m:1'], true);

const fatiguedAgain = planAnchors({
  items: [movie(1, 2, '2026-01-01')],
  multipliers: fatigued.multipliers,
  locks: fatigued.locks,
  fatigue: fatigued.fatigue,
  served: tired,
  now: new Date('2026-04-01T00:00:00Z'),
});
assert.equal(fatiguedAgain.multipliers['m:1'], 0.5);

const fresh = planAnchors({
  items: [movie(1, 2, '2026-01-01')],
  served: [0.9, 0.95, 0.8, 0.9].map((bestPassRatio) => ({ anchorKey: 'm:1', bestPassRatio })),
  now: new Date('2026-04-01T00:00:00Z'),
});
assert.equal(fresh.multipliers['m:1'], undefined);

const tooFew = planAnchors({
  items: [movie(1, 2, '2026-01-01')],
  served: tired.slice(0, 3),
  now: new Date('2026-04-01T00:00:00Z'),
});
assert.equal(tooFew.multipliers['m:1'], undefined);

console.log('ok anchors');
