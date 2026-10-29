'use strict';

const assert = require('node:assert/strict');
const {
  catalogIndexSpecs,
  songLinkIndexSpecs,
  watchStateIndexSpecs,
  eventIndexSpecs,
  profileIndexSpecs,
  statsIndexSpecs,
  feedSessionIndexSpecs,
} = require('../repositories/indexes');

const catalogNames = catalogIndexSpecs.map((spec) => spec.options.name);
assert.ok(catalogIndexSpecs.some((spec) => spec.options.unique && spec.options.name === 'shortId_unique'));
assert.deepEqual(catalogNames, [
  'shortId_unique',
  'movieId',
  'musicKey',
  'songGroupId',
  'artistId',
  'type_contentType',
  'movieGenres',
  'movieCountries',
  'musicGenres',
  'musicCountries',
  'actors',
  'franchiseMovieIds',
  'catalogAddedAt_desc',
]);
assert.deepEqual(
  catalogIndexSpecs.find((spec) => spec.options.name === 'catalogAddedAt_desc').key,
  { catalogAddedAt: -1 }
);
assert.ok(songLinkIndexSpecs.some((spec) => spec.options.unique && spec.key.songGroupId === 1));
assert.ok(songLinkIndexSpecs.some((spec) => spec.key['members.musicKey'] === 1));
assert.ok(
  watchStateIndexSpecs.some(
    (spec) => spec.options.unique && spec.key.userId === 1 && spec.key.shortId === 1
  )
);
assert.ok(eventIndexSpecs.some((spec) => spec.options.unique && spec.key.eventId === 1));
assert.equal(
  eventIndexSpecs.find((spec) => spec.options.name === 'createdAt_ttl').options.expireAfterSeconds,
  7 * 24 * 60 * 60
);
assert.ok(profileIndexSpecs.some((spec) => spec.options.unique && spec.key.userId === 1));
assert.ok(statsIndexSpecs.some((spec) => spec.options.unique && spec.key.shortId === 1));
assert.ok(feedSessionIndexSpecs.some((spec) => spec.options.unique && spec.key.sessionId === 1));
assert.ok(feedSessionIndexSpecs.some((spec) => spec.key.userId === 1 && spec.key.updatedAt === -1));
assert.equal(
  feedSessionIndexSpecs.find((spec) => spec.options.name === 'updatedAt_ttl').options.expireAfterSeconds,
  2 * 24 * 60 * 60
);

console.log('ok indexes');
