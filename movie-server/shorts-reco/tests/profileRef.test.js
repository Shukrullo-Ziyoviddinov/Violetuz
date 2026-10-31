'use strict';

const assert = require('node:assert/strict');
const {
  PROFILE_KINDS,
  profileRef,
  artistProfileRef,
  parseProfileRef,
} = require('../services/profileHeat/profileRef');

assert.deepEqual(PROFILE_KINDS, ['artist', 'channel', 'actor']);

const jah = artistProfileRef('jah-khalib');
assert.deepEqual(jah, {
  kind: 'artist',
  id: 'jah-khalib',
  key: 'artist:s:jah-khalib',
});
assert.equal(typeof jah.id, 'string');

const shohruh = artistProfileRef('  shohruhxon  ');
assert.equal(shohruh.id, 'shohruhxon');
assert.equal(shohruh.key, 'artist:s:shohruhxon');

const actor = profileRef('actor', 1);
assert.deepEqual(actor, { kind: 'actor', id: 1, key: 'actor:n:1' });
assert.equal(typeof actor.id, 'number');

const actorText = profileRef('actor', '1');
assert.equal(actorText.id, '1');
assert.equal(typeof actorText.id, 'string');
assert.notEqual(actorText.key, actor.key);

const channel = profileRef('CHANNEL', 'studio-1');
assert.deepEqual(channel, {
  kind: 'channel',
  id: 'studio-1',
  key: 'channel:s:studio-1',
});

assert.equal(profileRef('artist', ''), null);
assert.equal(profileRef('artist', '   '), null);
assert.equal(profileRef('artist', null), null);
assert.equal(profileRef('artist', { id: 'jah-khalib' }), null);
assert.equal(profileRef('artist', ['jah-khalib']), null);
assert.equal(profileRef('artist', true), null);
assert.equal(profileRef('artist', Number.NaN), null);
assert.equal(profileRef('artist', Number.POSITIVE_INFINITY), null);
assert.equal(profileRef('artist', 1.5), null);
assert.equal(profileRef('movie', 'jah-khalib'), null);
assert.equal(profileRef('', 'jah-khalib'), null);
assert.equal(artistProfileRef(null), null);

assert.equal(profileRef('artist', 'Jah-Khalib').id, 'Jah-Khalib');

assert.deepEqual(parseProfileRef(jah.key), jah);
assert.deepEqual(parseProfileRef(actor.key), actor);
assert.deepEqual(parseProfileRef(actorText.key), actorText);
assert.deepEqual(parseProfileRef(channel.key), channel);
assert.equal(parseProfileRef('artist:jah-khalib'), null);
assert.equal(parseProfileRef('artist:n:01'), null);
assert.equal(parseProfileRef('artist:s: '), null);
assert.equal(parseProfileRef('movie:s:1'), null);
assert.equal(parseProfileRef(null), null);

console.log('ok profileRef');
