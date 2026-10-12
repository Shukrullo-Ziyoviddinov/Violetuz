/**
 * album-home-feed offline verify (DB shart emas).
 * music-home-feed fayllariga tegilmaydi.
 *
 * Run: node scripts/verifyAlbumHomeFeed.js
 */

'use strict';

const path = require('path');
const fs = require('fs');

const { albumHomeFeedWeights } = require('../album-home-feed/config/albumHomeFeedWeights');
const { catalogAlbumMatch, ALBUM_CATALOG_TYPES } = require('../album-home-feed/repositories/catalog.read');
const { albumContentMatch, isAlbumContentType } = require('../album-home-feed/repositories/albumContent');
const { listenedIdsFromAlbumEvents } = require('../album-home-feed/services/guestFeed.service');
const { assembleAlbumFeed } = require('../album-home-feed/rank/buildFeed');
const Album = require('../models/Album.model');

const errors = [];
const ok = (msg) => console.log('OK  ' + msg);
const fail = (msg) => {
  errors.push(msg);
  console.log('FAIL ' + msg);
};

const walk = (dir, acc = []) => {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, acc);
    else if (full.endsWith('.js')) acc.push(full);
  }
  return acc;
};

const moduleDir = path.join(__dirname, '../album-home-feed');
const moduleFiles = walk(moduleDir);

for (const file of moduleFiles) {
  const src = fs.readFileSync(file, 'utf8');
  if (/require\(['"][^'"]*music-home-feed/.test(src)) {
    fail('music-home-feed require in ' + path.relative(moduleDir, file));
  }
  if (/require\(['"][^'"]*models\/(Music|Clip|Concert)\.model/.test(src)) {
    fail('track/clip/concert model require in ' + path.relative(moduleDir, file));
  }
}
ok('module does not require music-home-feed, Music, Clip, or Concert');

const catalogSrc = fs.readFileSync(path.join(moduleDir, 'repositories/catalog.read.js'), 'utf8');
if (!catalogSrc.includes("require('../../models/Album.model')")) {
  fail('catalog does not read Album model');
} else ok('catalog reads musicAlbums via Album model');

if (albumHomeFeedWeights.contentType !== 'album') fail('contentType is not album');
else ok('contentType album');

const excluded = albumHomeFeedWeights.excludedContentTypes || [];
for (const type of ['music', 'clip', 'concert']) {
  if (!excluded.includes(type)) fail('excluded missing ' + type);
}
ok('music, clip, concert excluded');

if (albumContentMatch().contentType !== 'album') fail('albumContentMatch');
else ok('progress/event/reco match is contentType album');

const typeFilter = catalogAlbumMatch().type?.$in || [];
for (const type of ALBUM_CATALOG_TYPES) {
  if (!typeFilter.includes(type)) fail('catalog type missing ' + type);
}
for (const type of ['music', 'clip', 'klip', 'concert']) {
  if (typeFilter.includes(type)) fail('catalog type includes ' + type);
}
ok('catalog type filter is album only');

const guest = listenedIdsFromAlbumEvents([
  { m: '1', ct: 'music' },
  { m: '2', ct: 'album' },
  { m: '3', ct: 'clip' },
  { m: '4', ct: 'concert' },
  { m: '5', ct: 'klip' },
  { m: '2', ct: 'album' },
]);
const guestIds = [...guest.listenedIds];
if (guestIds.length !== 1 || guestIds[0] !== '2') fail('guest history kept non-album ids');
else ok('guest history keeps only album ids');

if (!isAlbumContentType('album') || isAlbumContentType('music') || isAlbumContentType('clip')) {
  fail('isAlbumContentType');
} else ok('isAlbumContentType');

const liveAlbums = [
  {
    id: 1001,
    categoryNameMusic: 'hitCollectionsData',
    artistId: 'jah-khalib',
    genre: 'Pop',
    type: 'musicAlbom',
  },
  {
    id: 900001,
    categoryNameMusic: 'tracks',
    artistId: 'someone',
    genre: 'Pop',
    type: 'music',
  },
];

const originalFind = Album.find;
Album.find = (filter = {}) => {
  const allowedTypes = filter.type?.$in || null;
  const allowedIds = filter.id?.$in || null;
  const rows = liveAlbums.filter((row) => {
    if (allowedTypes && !allowedTypes.includes(row.type)) return false;
    if (allowedIds && !allowedIds.map(Number).includes(Number(row.id))) return false;
    return true;
  });
  const query = {
    select() { return query; },
    sort() { return query; },
    limit() { return query; },
    lean: async () => rows,
  };
  return query;
};

const row = (contentId, sourceType) => ({
  contentId,
  category: 'hitCollectionsData',
  sourceType,
  rawScore: 1,
});

assembleAlbumFeed({
  personal: [
    row('1001', 'personal'),
    row('900001', 'personal'),
    row('900002', 'personal'),
    row('900003', 'personal'),
  ],
  collaborative: [],
  trending: [],
  fresh: [],
  exploration: [],
  listenedIds: new Set(),
})
  .then((feed) => {
    Album.find = originalFind;
    const ids = (feed.albums || []).map((item) => String(item.contentId));
    const leaked = ids.filter((id) => id !== '1001');
    if (!ids.includes('1001')) fail('album 1001 missing from feed');
    else if (leaked.length) fail('feed contains non-album ids: ' + leaked.join(','));
    else ok('feed contains only catalog albums');

    if (errors.length) {
      console.log('FAILED ' + errors.length);
      process.exit(1);
    }
    console.log('verifyAlbumHomeFeed passed');
  })
  .catch((err) => {
    Album.find = originalFind;
    console.error(err);
    process.exit(1);
  });
