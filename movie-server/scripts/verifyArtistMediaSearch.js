/**
 * Artist → musiqa/klip/konsert/albom search tekshiruv.
 * node movie-server/scripts/verifyArtistMediaSearch.js
 */

const fs = require('fs');
const path = require('path');
const { parseMusicSearchFacets } = require('../utils/searchMusicFacets');
const { parseContentType } = require('../utils/searchContentType');
const { rankAllResults } = require('../utils/searchAlgorithm');
const { resolveNeededScopes } = require('../services/search.service');

const read = (name) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, '../data', name), 'utf8'));

const artists = read('artists.json').map((a) => ({
  id: a.id,
  name: a.name,
  image: a.image,
}));

const music = read('music.json').map((m) => ({
  id: m.id,
  title: m.title,
  artistId: m.artistId,
  year: m.year,
  genre: m.genre,
  country: m.country,
  img: m.img,
}));

const clips = read('klips.json').map((c) => ({
  id: c.id,
  title: c.title,
  artistId: c.artistId,
  year: c.year,
  genre: c.genre,
  country: c.country,
  img: c.img,
}));

const concerts = read('konsert.json').map((c) => ({
  id: c.id,
  title: c.title,
  artistId: c.artistId,
  year: c.year,
  genre: c.genre,
  country: c.country,
  img: c.img,
}));

const albums = read('musicAlbom.json').map((a) => ({
  id: a.id,
  title: a.title,
  artist: a.artist,
  artistId: a.artistId,
  year: a.year,
  genre: a.genre,
  country: a.country,
  img: a.img,
  songs: a.songs,
}));

let fail = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) {
    fail += 1;
    console.log('FAIL:', name, extra);
  } else {
    console.log('OK  :', name, extra);
  }
};

const cols = {
  actors: [],
  movies: [],
  music,
  albums,
  clips,
  concerts,
  musicArtists: artists,
};

const allJah = (list) =>
  list.length > 0 && list.every((x) => String(x.artistId) === 'jah-khalib');

// Content type multi
const ct1 = parseContentType('jah khalib musiqalari kliplari konsertlari');
ok(
  'multi types',
  ct1.types.includes('music') && ct1.types.includes('clip') && ct1.types.includes('concert'),
  JSON.stringify(ct1.types)
);
ok('remainder artist', ct1.remainder.includes('jah') && ct1.remainder.includes('khalib'));

const ct2 = parseContentType('musiqa albomlar');
ok('album not also music', ct2.types.length === 1 && ct2.types[0] === 'album', JSON.stringify(ct2.types));

// Facets
const f1 = parseMusicSearchFacets('jah khalib musiqalari');
ok('artist tokens', f1.titleTokens.includes('jah') && f1.titleTokens.includes('khalib'));

const f2 = parseMusicSearchFacets('jah khalib kuylagan 2025 dagi rap musiqalari tuplami');
ok('kuylagan stripped', !f2.titleTokens.includes('kuylagan'));
ok('year exact', f2.isYearSearch && f2.year === 2025 && f2.yearMode === 'exact');
ok('rap genre', f2.genreTargets.some((g) => /rap|hip/i.test(String(g))));
ok('name kept', f2.titleTokens.includes('jah') && f2.titleTokens.includes('khalib'));

const f3 = parseMusicSearchFacets('jah khalib musiqalari kliplari');
ok('cross type noise', !f3.titleTokens.includes('kliplari') && f3.titleTokens.includes('jah'));

// Scope
const sc1 = resolveNeededScopes('jah khalib musiqalari');
ok('scope music+artists', sc1.music && sc1.musicArtists && !sc1.movies);

const sc2 = resolveNeededScopes('jah khalib musiqalari kliplari konsertlari');
ok(
  'scope multi',
  sc2.music && sc2.clips && sc2.concerts && sc2.musicArtists && !sc2.albums,
  JSON.stringify(sc2)
);

// Rank single
const r1 = rankAllResults('jah khalib musiqalari', cols);
ok('artist card', r1.musicArtists.some((a) => a.id === 'jah-khalib'), `n=${r1.musicArtists.length}`);
ok('music linked', allJah(r1.music), `n=${r1.music.length}`);
ok('no clip pollution', r1.clips.length === 0);

const r2 = rankAllResults('jah khalib kliplari', cols);
ok('clips linked', allJah(r2.clips), `n=${r2.clips.length}`);
ok('artist on clip query', r2.musicArtists.some((a) => a.id === 'jah-khalib'));

const r3 = rankAllResults('jah khalib albomlari', cols);
ok('albums linked', allJah(r3.albums), `n=${r3.albums.length}`);

const r4 = rankAllResults('jah khalib konsertlari', cols);
ok('concerts linked', allJah(r4.concerts), `n=${r4.concerts.length}`);

// Multi type
const r5 = rankAllResults('jah khalib musiqalari kliplari konsertlari', cols);
ok('multi artist', r5.musicArtists.some((a) => a.id === 'jah-khalib'));
ok('multi music', allJah(r5.music), `n=${r5.music.length}`);
ok('multi clips', allJah(r5.clips), `n=${r5.clips.length}`);
ok('multi concerts', allJah(r5.concerts), `n=${r5.concerts.length}`);
ok('multi no albums', r5.albums.length === 0);

// Year + genre
const r6 = rankAllResults('jah khalib 2024 rap musiqalari', cols);
ok('2024 rap artist', r6.musicArtists.some((a) => a.id === 'jah-khalib'));
ok(
  '2024 rap music',
  r6.music.length > 0 &&
    r6.music.every(
      (m) =>
        m.artistId === 'jah-khalib' &&
        Number(m.year) === 2024 &&
        /rap|hip/i.test(String(m.genre))
    ),
  `n=${r6.music.length} genres=${[...new Set(r6.music.map((m) => m.genre))]}`
);

const r7 = rankAllResults('jah khalib kuylagan rap musiqalari tuplami', cols);
ok('noise phrasing', allJah(r7.music) && r7.musicArtists.length > 0, `n=${r7.music.length}`);

// Regression: pure / genre type
const r8 = rankAllResults('rap musiqalari', cols);
ok('rap no fake artist required', r8.music.length > 0, `n=${r8.music.length}`);
ok(
  'rap genres',
  r8.music.every((m) => /rap|hip/i.test(String(m.genre))),
  `genres=${[...new Set(r8.music.map((m) => m.genre))]}`
);

const r10 = rankAllResults('jah khalib kipi', cols);
ok('kipi typo is clip', allJah(r10.clips) && r10.music.length === 0, `clips=${r10.clips.length}`);

console.log(`\nTOTAL FAILS: ${fail}`);
process.exit(fail ? 1 : 0);
