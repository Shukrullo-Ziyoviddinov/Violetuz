'use strict';

const assert = require('node:assert/strict');
const config = require('../config');
const {
  shortCatalogId,
  parseShortCatalogId,
  musicKey,
  parseMusicKey,
  artistProfileKey,
  movieProfileKey,
  sanitizeKeyPart,
} = require('../utils/keys');

assert.equal(shortCatalogId('movieShorts', 1), 'movieShorts:1');
assert.equal(shortCatalogId('musicshorts', '10001'), 'musicshorts:10001');
assert.equal(shortCatalogId('movieShorts', null), null);
assert.deepEqual(parseShortCatalogId('musicshorts:10001'), {
  type: 'musicshorts',
  numericId: 10001,
});

assert.equal(musicKey('music', 802), 'music:802');
assert.equal(musicKey('klip', 550), 'klip:550');
assert.equal(musicKey('konsert', 12), 'konsert:12');
assert.equal(musicKey('music', null), null);
assert.deepEqual(parseMusicKey('klip:550'), { kind: 'klip', id: 550 });

assert.equal(artistProfileKey('jah.khalib$1'), 'a:jah_khalib_1');
assert.equal(movieProfileKey(4), 'm:4');
assert.equal(sanitizeKeyPart('a.b$c'), 'a_b_c');
assert.equal(artistProfileKey(null), null);

assert.throws(() => {
  config.feedBatchSize = 1;
});
assert.equal(config.feedBatchSize, 20);
assert.equal(config.catalogSyncIntervalMinutes, 15);
assert.deepEqual(config.contentTypes, ['music', 'klip', 'konsert']);

console.log('ok keys');
