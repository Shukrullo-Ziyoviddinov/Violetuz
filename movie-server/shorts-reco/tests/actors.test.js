'use strict';

const assert = require('node:assert/strict');
const {
  movieEngagementDelta,
  cappedEngagement,
  isQualifying,
  topQualifyingMovies,
  confirmedActors,
  skipPenaltyAmount,
  splitActorSlots,
} = require('../services/actors.service');

const near = (actual, expected) => {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} !== ${expected}`);
};

assert.equal(cappedEngagement(9), 5);
assert.equal(cappedEngagement(-2), 0);
assert.equal(isQualifying(1), true);
assert.equal(isQualifying(0.9), false);

assert.equal(movieEngagementDelta('musicshorts', 0, 4), 0);
assert.equal(movieEngagementDelta('movieShorts', 0, 1.5), 1.5);
assert.equal(movieEngagementDelta('movieShorts', -1, 1.5), 1.5);

const oneMovie = topQualifyingMovies({ 4: 5 }, { 4: [7] });
assert.equal(confirmedActors(oneMovie).ids.size, 0);

const twoMovies = topQualifyingMovies(
  { 4: 9, 5: 2, 6: 0.5 },
  { 4: [7, 7, 8], 5: [7], 6: [7] }
);
const confirmed = confirmedActors(twoMovies);
assert.equal(confirmed.ids.has('7'), true);
assert.equal(confirmed.ids.has('8'), false);
near(confirmed.scores['7'], 7);
assert.equal(twoMovies.find((movie) => movie.movieId === '6'), undefined);
near(twoMovies.find((movie) => movie.movieId === '4').capped, 5);

const cappedPair = confirmedActors(topQualifyingMovies(
  { 1: 9, 2: 9 },
  { 1: [3], 2: [3] }
));
near(cappedPair.scores['3'], 10);

const penalized = confirmedActors(topQualifyingMovies(
  { 1: 9, 2: 9 },
  { 1: [3], 2: [3] }
), { 'ac:3': 0.5 });
near(penalized.scores['3'], 9.5);
near(skipPenaltyAmount(-1), 0.5);
near(skipPenaltyAmount(1.5), 0);

const wiped = confirmedActors(topQualifyingMovies(
  { 1: 9, 2: 9 },
  { 1: [3], 2: [3] }
), { 'ac:3': 100 });
near(wiped.scores['3'], 0);

const limited = topQualifyingMovies({ 1: 5, 2: 4, 3: 3 }, { 1: [], 2: [], 3: [] }, 2);
assert.deepEqual(limited.map((movie) => movie.movieId), ['1', '2']);

assert.deepEqual(splitActorSlots({ a: 2, b: 1 }, 2), { a: 1, b: 1 });
assert.deepEqual(splitActorSlots({ a: 5, b: 1 }, 2), { a: 2, b: 0 });
assert.deepEqual(splitActorSlots({ a: 5 }, 0), {});
assert.deepEqual(splitActorSlots({}, 2), {});

console.log('ok actors');
