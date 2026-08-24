/**
 * Media year facet tekshiruv: music / clip / album / concert (+ movie regression).
 * node movie-server/scripts/verifyMediaYearSearch.js
 */

const fs = require('fs');
const path = require('path');
const { rankAllResults } = require('../utils/searchAlgorithm');
const { resolveNeededScopes } = require('../services/search.service');
const { parseMusicSearchFacets } = require('../utils/searchMusicFacets');
const { parseClipSearchFacets } = require('../utils/searchClipFacets');
const { parseAlbumSearchFacets } = require('../utils/searchAlbumFacets');
const { parseConcertSearchFacets } = require('../utils/searchConcertFacets');

const lean = (file, mapFn) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, '../data', file), 'utf8')).map(mapFn);

const music = lean('music.json', (m) => ({
  id: m.id,
  title: m.title,
  year: m.year,
  genre: m.genre,
  country: m.country,
  artistId: m.artistId,
  img: m.img,
}));
const clips = lean('klips.json', (m) => ({
  id: m.id,
  title: m.title,
  year: m.year,
  genre: m.genre,
  country: m.country,
  artistId: m.artistId,
  img: m.img,
}));
const concerts = lean('konsert.json', (m) => ({
  id: m.id,
  title: m.title,
  year: m.year,
  genre: m.genre,
  country: m.country,
  artistId: m.artistId,
  img: m.img,
}));
const albums = lean('musicAlbom.json', (m) => ({
  id: m.id,
  title: m.title,
  year: m.year,
  genre: m.genre,
  country: m.country,
  artistId: m.artistId,
  artist: m.artist,
  img: m.img,
  songs: (m.songs || []).map((s) => ({ title: s.title, artist: s.artist })),
}));

const collections = { music, clips, concerts, albums, movies: [], actors: [], musicArtists: [] };

let fail = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) {
    fail += 1;
    console.log('FAIL:', name, extra);
  } else {
    console.log('OK  :', name, extra);
  }
};

const isDesc = (list) => {
  for (let i = 1; i < list.length; i += 1) {
    if ((Number(list[i].year) || 0) > (Number(list[i - 1].year) || 0)) return false;
  }
  return true;
};

// Facet parse
ok(
  'yangi musiqalar facet',
  parseMusicSearchFacets('yangi musiqalar').yearMode === 'recency' &&
    parseMusicSearchFacets('yangi musiqalar').titleTokens.length === 0
);
ok(
  '2025 musiqalar toplami',
  parseMusicSearchFacets('2025 musiqalar toplami').year === 2025 &&
    parseMusicSearchFacets('2025 musiqalar toplami').titleTokens.length === 0
);
ok('yangi kliplar facet', parseClipSearchFacets('yangi kliplar').yearMode === 'recency');
ok('yangi albomlar facet', parseAlbumSearchFacets('yangi albomlar').yearMode === 'recency');
ok('yangi konsertlar facet', parseConcertSearchFacets('yangi konsertlar').yearMode === 'recency');

// Scope
ok('scope yangi musiqalar', JSON.stringify(resolveNeededScopes('yangi musiqalar')) === '{"music":true}');
ok('scope yangi kliplar', JSON.stringify(resolveNeededScopes('yangi kliplar')) === '{"clips":true}');
// "2025 albomlar" — pure emas (remainder year), artist scope ham ochilishi mumkin
const albumScope = resolveNeededScopes('2025 albomlar');
ok('scope 2025 albomlar has albums', albumScope.albums === true);
ok(
  'scope yangi konsertlar',
  JSON.stringify(resolveNeededScopes('yangi konsertlar')) === '{"concerts":true}'
);

// Rank
const rMusic = rankAllResults('yangi musiqalar', collections);
ok('yangi musiqalar only music', rMusic.music.length > 0 && rMusic.clips.length === 0, `n=${rMusic.music.length}`);
ok('yangi musiqalar DESC', isDesc(rMusic.music));

const r2025 = rankAllResults('2025 musiqalar toplami', collections);
ok(
  '2025 musiqalar exact',
  r2025.music.length > 0 && r2025.music.every((m) => m.year === 2025),
  `n=${r2025.music.length}`
);

const rClip = rankAllResults('yangi kliplar', collections);
ok('yangi kliplar', rClip.clips.length > 0 && isDesc(rClip.clips), `n=${rClip.clips.length}`);

const rAlb = rankAllResults('yangi albomlar', collections);
ok('yangi albomlar', rAlb.albums.length > 0 && isDesc(rAlb.albums), `n=${rAlb.albums.length}`);

const rCon = rankAllResults('yangi konsertlar', collections);
ok('yangi konsertlar', rCon.concerts.length > 0 && isDesc(rCon.concerts), `n=${rCon.concerts.length}`);

const rClip2024 = rankAllResults('2024 kliplar', collections);
ok(
  '2024 kliplar',
  rClip2024.clips.every((m) => m.year === 2024),
  `n=${rClip2024.clips.length}`
);

console.log('\n--- timing ---');
for (const q of ['yangi musiqalar', 'yangi kliplar', '2025 musiqalar toplami', 'yangi albomlar']) {
  const t0 = process.hrtime.bigint();
  const r = rankAllResults(q, collections);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  const n =
    r.music.length || r.clips.length || r.albums.length || r.concerts.length;
  console.log(`${q} → ${ms.toFixed(2)}ms | n=${n}`);
}

console.log(`\nTOTAL FAILS: ${fail}`);
process.exit(fail ? 1 : 0);
