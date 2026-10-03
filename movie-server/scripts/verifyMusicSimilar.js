/**
 * music-similar offline verify (DB shart emas).
 * movie-similar verify ga tegilmaydi.
 *
 * Run: node scripts/verifyMusicSimilar.js
 */

'use strict';

const path = require('path');
const fs = require('fs');

const music = require('../data/music.json');
const klips = require('../data/klips.json');
const albums = require('../data/musicAlbom.json');
const similar = require('../music-similar');
const {
  buildSimilarMusicItems,
  computeGeneralSimilarity,
  interleaveArtistGenreAndGeneral,
  artistIdOf,
  genreOf,
} = require('../music-similar/services/similarMusicEngine');
const {
  normalizeContentType,
} = require('../music-similar/repositories/catalog.read');
const { similarityWeights } = require('../music-similar/config/similarityWeights');

const L = similarityWeights.layers;
const errors = [];
const ok = (msg) => console.log('OK  ' + msg);
const fail = (msg) => {
  errors.push(msg);
  console.log('FAIL ' + msg);
};

const walk = (dir, acc = []) => {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else if (p.endsWith('.js')) acc.push(p);
  }
  return acc;
};

for (const f of walk(path.join(__dirname, '../music-similar'))) {
  const src = fs.readFileSync(f, 'utf8');
  if (
    /require\(['"][^'"]*recommendation/.test(src) ||
    /require\(['"][^'"]*home-feed/.test(src) ||
    /require\(['"][^'"]*movie-similar/.test(src) ||
    /require\(['"][^'"]*music-mixes/.test(src)
  ) {
    fail('import leak in ' + f);
  }
}
ok('module isolation (no rec/home-feed/movie-similar/mixes)');

if (
  !similar.similarityWeights ||
  !similar.models?.MusicSimilarCache ||
  !similar.services?.buildSimilarMusicItems ||
  !similar.repositories?.replaceSimilarForSource ||
  !similar.jobs?.refreshAllSimilarMusicItems ||
  !similar.routes
) {
  fail('module exports incomplete');
} else ok('module exports complete');

const Music = require('../models/Music.model');
const Clip = require('../models/Clip.model');
const Album = require('../models/Album.model');
const Concert = require('../models/Concert.model');

if (!Music.schema.paths.franchiseMusicIds) fail('Music.schema missing franchiseMusicIds');
else ok('Music.schema franchiseMusicIds');
if (!Clip.schema.paths.franchiseClipIds) fail('Clip.schema missing franchiseClipIds');
else ok('Clip.schema franchiseClipIds');
if (Album.schema.paths.franchiseMusicIds || Album.schema.paths.franchiseClipIds) {
  fail('Album should not have franchise field');
} else ok('Album has no franchise field');
if (Concert.schema.paths.franchiseMusicIds || Concert.schema.paths.franchiseClipIds) {
  fail('Concert should not have franchise field');
} else ok('Concert has no franchise field');

if (normalizeContentType('concert') != null) fail('concert not skipped');
else ok('concert contentType null');
if (normalizeContentType('musicAlbom') !== 'album') fail('musicAlbom normalize');
else ok('musicAlbom → album');

const m801 = music.find((m) => m.id === 801);
if (!m801?.franchiseMusicIds?.length) fail('seed 801 missing franchiseMusicIds');
else ok('seed 801 has franchise');

const rows1 = buildSimilarMusicItems(m801, music, {
  contentType: 'music',
  limit: 10,
});
if (rows1.length > 10) fail('limit exceeded ' + rows1.length);
else ok('limit <= 10 (' + rows1.length + ')');

const franch = rows1.filter((r) => r.layer === L.franchise);
if (franch[0]?.id !== 806 || franch[1]?.id !== 803) {
  fail('L1 order expected [806,803] got ' + franch.map((r) => r.id).join(','));
} else ok('L1 franchise order [806,803]');
if (rows1[0]?.layer !== L.franchise) fail('L1 not on top');
else ok('L1 on top');

if (rows1.some((r) => r.id === 801)) fail('self in results');
else ok('self excluded');

const emptyF = { ...m801, franchiseMusicIds: [] };
const rEmpty = buildSimilarMusicItems(emptyF, music, {
  contentType: 'music',
  limit: 10,
});
if (rEmpty.some((r) => r.layer === L.franchise)) fail('empty franchise L1');
else ok('empty franchise skips L1');
if (rEmpty[0] && rEmpty[0].layer === L.franchise) fail('empty starts with L1');
else ok('empty starts from Q2/Q3');

const manyF = {
  ...m801,
  franchiseMusicIds: [806, 803, 804, 805, 807, 808],
};
const rMany = buildSimilarMusicItems(manyF, music, {
  contentType: 'music',
  limit: 10,
});
const fMany = rMany.filter((r) => r.layer === L.franchise);
if (fMany.length !== similarityWeights.q1Max) {
  fail('q1Max not applied ' + fMany.length);
} else ok('Q1 cut by q1Max=' + similarityWeights.q1Max);

const artist = artistIdOf(m801);
const genre = genreOf(m801);
const q2 = rows1.filter((r) => r.layer === L.artistGenre);
if (q2.length > similarityWeights.q2Max) fail('q2Max exceeded ' + q2.length);
else ok('Q2 cap <= q2Max (' + q2.length + ')');
if (q2.some((r) => artistIdOf(r.item) !== artist || genreOf(r.item) !== genre)) {
  fail('Q2 not hard artist+genre');
} else ok('Q2 hard artist+genre');

const afterQ1 = rows1.filter((r) => r.layer !== L.franchise);
const layersAfter = afterQ1.map((r) => r.layer);
const hasQ2 = layersAfter.includes(L.artistGenre);
const hasQ3 = layersAfter.includes(L.general);
if (hasQ2 && hasQ3) {
  const firstQ2 = layersAfter.indexOf(L.artistGenre);
  const firstQ3 = layersAfter.indexOf(L.general);
  const lastQ2 = layersAfter.lastIndexOf(L.artistGenre);
  if (lastQ2 > firstQ3 && firstQ2 < firstQ3) ok('Q2/Q3 interleaved after Q1');
  else if (q2.length <= 1) ok('Q2/Q3 mix (few Q2)');
  else fail('expected interleave, layers=' + layersAfter.join(','));
} else {
  ok('Q2/Q3 pool (q2=' + hasQ2 + ' q3=' + hasQ3 + ')');
}

const inter = interleaveArtistGenreAndGeneral(
  [{ l: 2 }, { l: 2 }, { l: 2 }],
  [{ l: 3 }, { l: 3 }, { l: 3 }, { l: 3 }, { l: 3 }, { l: 3 }, { l: 3 }],
  8
).map((x) => x.l);
const expected = [2, 3, 3, 2, 3, 3, 3, 2];
if (inter.join(',') !== expected.join(',')) {
  fail('interleave pattern ' + inter.join(','));
} else ok('interleave pattern 2,3,3,2,3,3,3,2');

const a = m801;
const b = music.find((m) => m.id === 806);
const score = computeGeneralSimilarity(a, b);
if (!(score > 0)) fail('general score 801vs806');
else ok('computeGeneralSimilarity=' + score.toFixed(3));

const album = albums[0];
if (!album) fail('no album seed');
else {
  const albumRows = buildSimilarMusicItems(album, albums, {
    contentType: 'album',
    limit: 10,
  });
  if (albumRows.some((r) => r.layer === L.franchise)) fail('album has Q1');
  else ok('album skips Q1');
  if (albumRows.length > 10) fail('album limit');
  else ok('album limit ok');
}

const k1101 = klips.find((k) => k.id === 1101);
const clipRows = buildSimilarMusicItems(k1101, klips, {
  contentType: 'klip',
  limit: 10,
});
const clipF = clipRows.filter((r) => r.layer === L.franchise);
if (clipF[0]?.id !== 1103 || clipF[1]?.id !== 1104) {
  fail('clip L1 order');
} else ok('clip L1 franchise order [1103,1104]');

const q3SameArtist = clipRows.filter(
  (r) =>
    r.layer === L.general &&
    String(r.item?.artistId || '').toLowerCase() ===
      String(k1101.artistId || '').toLowerCase()
);
if (q3SameArtist.length) fail('Q3 includes same artist');
else ok('Q3 excludes same artist');

const k1102 = klips.find((k) => k.id === 1102);
const dramaRows = buildSimilarMusicItems(k1102, klips, {
  contentType: 'klip',
  limit: 10,
});
const dramaQ3 = dramaRows.filter((r) => r.layer === L.general);
const dramaQ3Other = dramaQ3.filter(
  (r) =>
    String(r.item?.artistId || '').toLowerCase() !==
    String(k1102.artistId || '').toLowerCase()
);
if (dramaQ3.length && dramaQ3Other.length !== dramaQ3.length) {
  fail('drama Q3 same artist leak');
} else ok('drama Q3 only other artists (' + dramaQ3Other.length + ')');

if (similarityWeights.general.w2Artist != null) {
  fail('Q3 still has w2Artist');
} else ok('Q3 weights have no artist soft');

const concertLike = {
  id: 999001,
  type: 'konsert',
  artistId: 'x',
  genre: 'pop',
};
const concertRows = buildSimilarMusicItems(concertLike, [concertLike], {
  contentType: 'konsert',
  limit: 10,
});
if (concertRows.length) fail('concert should return []');
else ok('concert build returns []');

const ctrlSrc = fs.readFileSync(
  path.join(__dirname, '../music-similar/controllers/similar.controller.js'),
  'utf8'
);
if (/buildSimilarMusicItems/.test(ctrlSrc)) {
  fail('API calls engine (must be cache-only)');
} else ok('API cache-only (no engine in controller)');

if (/titleSimilarityMatcher/.test(
  fs.readFileSync(
    path.join(__dirname, '../music-similar/services/similarMusicEngine.js'),
    'utf8'
  )
)) {
  fail('title matcher imported in music engine');
} else ok('no title matcher in music engine');

console.log('\n--- SUMMARY ---');
if (errors.length) {
  console.log('FAILED ' + errors.length + ': ' + errors.join(' | '));
  process.exit(1);
}
console.log('ALL CHECKS PASSED');
process.exit(0);
