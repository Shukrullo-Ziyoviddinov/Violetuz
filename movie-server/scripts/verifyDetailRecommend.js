/**
 * detail-recommend offline verify (DB shart emas).
 * Fayl boshqa algoritmni chaqirmasligi, qo'shiq qatori faqat qo'shiq,
 * klip qatori faqat klip, bog'langan id birinchi.
 *
 * Run: node scripts/verifyDetailRecommend.js
 */

'use strict';

const path = require('path');
const fs = require('fs');

const {
  assembleDetailRecommend,
  guestMarkMatches,
  seenIdsFromGuestHistory,
} = require('../detail-recommend/detailRecommend');

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

const moduleDir = path.join(__dirname, '../detail-recommend');
const forbiddenRequire =
  /require\s*\(\s*['"][^'"]*(?:music-similar|music-home-feed|album-home-feed|recommendation-music|movie-similar|\/home-feed)/;

for (const file of walk(moduleDir)) {
  const src = fs.readFileSync(file, 'utf8');
  if (forbiddenRequire.test(src)) {
    fail('other algorithm require in ' + path.relative(moduleDir, file));
  }
}
if (!errors.length) ok('detail-recommend does not require other algorithms');

const song = (id, extra) => ({ id, type: 'music', ...extra });
const clip = (id, extra) => ({ id, type: 'klip', ...extra });

const mixed = [
  song(1, { artistId: 'a', genre: 'pop', language: 'en', country: 'us', year: 2020 }),
  song(2, { artistId: 'a', genre: 'pop', language: 'en', country: 'us', year: 2024 }),
  clip(3, { artistId: 'a', genre: 'pop', language: 'en', country: 'us', year: 2026 }),
  { id: 4, type: 'konsert', artistId: 'a', genre: 'pop', language: 'en', country: 'us', year: 2026 },
  { id: 5, type: 'musicAlbom', artistId: 'a', genre: 'pop', language: 'en', country: 'us', year: 2026 },
  song(9, { artistId: 'z', genre: 'jazz', language: 'fr', country: 'fr', year: 1990 }),
  clip(7, { artistId: 'z', genre: 'jazz', language: 'fr', country: 'fr', year: 1990 }),
  clip(8, { artistId: 'b', genre: 'pop', language: 'uz', country: 'us', year: 2025 }),
];

const idsOf = (rows) => rows.map((row) => String(row.id));
const typesOf = (rows) => [...new Set(rows.map((row) => String(row.type || '')))];

const songRail = assembleDetailRecommend({
  page: {
    type: 'klip',
    artistId: 'a',
    genre: 'pop',
    language: 'en',
    country: 'us',
    musicId: 9,
  },
  catalog: mixed,
  seenIds: ['9'],
});

if (idsOf(songRail)[0] !== '9') fail('linked song is not first: ' + idsOf(songRail).join(','));
else ok('linked song stays first');

if (typesOf(songRail).some((type) => type !== 'music')) {
  fail('song rail has non-music: ' + typesOf(songRail).join(','));
} else ok('song rail is music only');

if (idsOf(songRail).some((id) => id === '3' || id === '4' || id === '5' || id === '7')) {
  fail('song rail includes clip, concert, or album');
} else ok('song rail drops clip, concert, and album');

const concertRail = assembleDetailRecommend({
  page: {
    type: 'konsert',
    artistId: 'a',
    genre: 'pop',
    language: 'en',
    country: 'us',
    musicId: 9,
  },
  catalog: mixed,
  seenIds: [],
});
if (idsOf(concertRail)[0] !== '9') fail('concert linked song is not first');
else if (typesOf(concertRail).some((type) => type !== 'music')) fail('concert page rail is not music only');
else ok('concert page song rail keeps linked song first');

const clipRail = assembleDetailRecommend({
  page: {
    type: 'music',
    artistId: 'a',
    genre: 'pop',
    language: 'en',
    country: 'us',
    clipId: 7,
  },
  catalog: mixed,
  seenIds: ['7'],
});

if (idsOf(clipRail)[0] !== '7') fail('linked clip is not first: ' + idsOf(clipRail).join(','));
else ok('linked clip stays first');

if (typesOf(clipRail).some((type) => type !== 'klip')) {
  fail('clip rail has non-klip: ' + typesOf(clipRail).join(','));
} else ok('clip rail is klip only');

if (idsOf(clipRail).some((id) => id === '1' || id === '4' || id === '5' || id === '9')) {
  fail('clip rail includes song, concert, or album');
} else ok('clip rail drops song, concert, and album');

const albumRail = assembleDetailRecommend({
  page: {
    type: 'musicAlbom',
    artistId: 'a',
    genre: 'pop',
    language: 'en',
    country: 'us',
    clipId: 3,
    songs: [{ clipIds: [7, 8] }, { clipIds: [8] }],
  },
  catalog: mixed,
  seenIds: ['7'],
});

const albumIds = idsOf(albumRail);
if (albumIds[0] !== '7' || albumIds[1] !== '8') {
  fail('album linked clips are not first: ' + albumIds.join(','));
} else if (albumIds.filter((id) => id === '8').length !== 1) {
  fail('album linked clip repeated');
} else if (typesOf(albumRail).some((type) => type !== 'klip')) {
  fail('album clip rail is not klip only');
} else ok('album song clipIds stay first, in song order');

const guestMusic = seenIdsFromGuestHistory(
  [
    { ct: 'music', m: '1' },
    { ct: 'album', m: '2' },
    { ct: 'clip', m: '3' },
    { ct: 'concert', m: '4' },
    { ct: 'konsert', m: '5' },
  ],
  'music'
);
const guestClips = seenIdsFromGuestHistory(
  [
    { ct: 'klip', m: '6' },
    { ct: 'clip', m: '7' },
    { ct: 'music', m: '1' },
    { ct: 'album', m: '2' },
    { ct: 'concert', m: '4' },
  ],
  'klip'
);

if ([...guestMusic].join(',') !== '1') fail('guest song marks: ' + [...guestMusic].join(','));
else ok('guest song marks ignore album and concert');

if ([...guestClips].sort().join(',') !== '6,7') fail('guest clip marks: ' + [...guestClips].join(','));
else ok('guest clip marks ignore album, concert, and music');

if (guestMarkMatches('music', 'album') || guestMarkMatches('klip', 'konsert')) {
  fail('album or concert counted as a song or clip');
} else ok('album and concert marks are not songs or clips');

const popClip = (id, artistId, year, language = 'en') => clip(id, {
  artistId,
  genre: 'pop',
  language,
  country: 'us',
  year,
});

const spacedIds = idsOf(assembleDetailRecommend({
  page: { type: 'music', artistId: 'a', genre: 'pop', language: 'en', country: 'us' },
  catalog: [
    popClip(1, 'a', 2026),
    popClip(2, 'a', 2025),
    popClip(3, 'a', 2024),
    popClip(4, 'a', 2023),
    popClip(5, 'a', 2022),
    popClip(6, 'a', 2021),
    popClip(7, 'a', 2020),
    popClip(8, 'a', 2019),
    popClip(10, 'b', 2018),
    popClip(11, 'c', 2017),
    popClip(12, 'd', 2016),
    popClip(13, 'e', 2015),
  ],
  seenIds: [],
}));

const runsOf = (ids, activeIds) => {
  const runs = [];
  let run = 0;
  for (const id of ids) {
    if (activeIds.has(id)) {
      run += 1;
    } else if (run) {
      runs.push(run);
      run = 0;
    }
  }
  if (run) runs.push(run);
  return runs;
};

if (spacedIds.slice(0, 3).join(',') !== '1,2,3') {
  fail('artist block is not the three newest: ' + spacedIds.join(','));
} else if (spacedIds.includes('7') || spacedIds.includes('8')) {
  fail('genre step kept more than 3 active artist clips');
} else if (runsOf(spacedIds.slice(3), new Set(['4', '5', '6'])).some((run) => run > 2)) {
  fail('active artist runs past 2 inside the genre step: ' + spacedIds.join(','));
} else if (spacedIds.join(',') !== '1,2,3,10,4,5,11,6,12,13') {
  fail('genre mix order: ' + spacedIds.join(','));
} else ok('genre step mixes the active artist inside itself');

const otherIds = idsOf(assembleDetailRecommend({
  page: { type: 'music', artistId: 'a', genre: 'pop', language: 'en', country: 'us' },
  catalog: [
    popClip(1, 'a', 2026),
    popClip(2, 'a', 2025),
    popClip(3, 'a', 2024),
    popClip(10, 'b', 2023),
    popClip(11, 'c', 2022),
    popClip(4, 'a', 2021, 'uz'),
    popClip(5, 'a', 2020, 'uz'),
    popClip(6, 'a', 2019, 'uz'),
    popClip(7, 'a', 2018, 'uz'),
    popClip(12, 'b', 2017, 'uz'),
  ],
  seenIds: [],
}));

if (otherIds.slice(0, 5).join(',') !== '1,2,3,10,11') {
  fail('other language mixed into the genre step: ' + otherIds.join(','));
} else if (otherIds.includes('7')) {
  fail('other-language step kept more than 3 active artist clips');
} else if (otherIds.slice(5).join(',') !== '4,5,12,6') {
  fail('other-language mix order: ' + otherIds.join(','));
} else ok('other-language step mixes inside itself');

if (errors.length) {
  console.log('FAILED ' + errors.length);
  process.exit(1);
}
console.log('verifyDetailRecommend passed');
