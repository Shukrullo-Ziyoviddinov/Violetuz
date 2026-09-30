'use strict';

const path = require('path');
const fs = require('fs');
const movies = require('../data/movie.json');
const similar = require('../movie-similar');
const {
  buildSimilarMovies,
  computeGeneralSimilarity,
  genresOf,
  actorsOf,
  countriesOf,
  yearOf,
  directorOf,
  hasCommonGenre,
} = require('../movie-similar/services/similarMoviesEngine');
const {
  normalizeTitle,
  titleOverlapScore,
  localizedTitleOverlapScore,
} = require('../movie-similar/services/titleSimilarityMatcher');
const { similarityWeights } = require('../movie-similar/config/similarityWeights');

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

for (const f of walk(path.join(__dirname, '../movie-similar'))) {
  const src = fs.readFileSync(f, 'utf8');
  if (
    /require\(['"][^'"]*recommendation/.test(src) ||
    /require\(['"][^'"]*home-feed/.test(src)
  ) {
    fail('import leak in ' + f);
  }
}
ok('module isolation (no rec/home-feed requires)');

if (
  !similar.similarityWeights ||
  !similar.models?.MovieSimilarCache ||
  !similar.services?.buildSimilarMovies ||
  !similar.repositories?.replaceSimilarForMovie ||
  !similar.jobs?.refreshAllSimilarMovies ||
  !similar.routes
) {
  fail('module exports incomplete');
} else ok('module exports complete');

const Movie = require('../models/Movie.model');
if (!Movie.schema.paths.franchiseMovieIds) fail('Movie.schema missing franchiseMovieIds');
else ok('Movie.schema franchiseMovieIds');

const words = normalizeTitle('John Wick 4: Film!');
if (!words.includes('john') || !words.includes('wick') || words.includes('film')) {
  fail('normalizeTitle stop/punct');
} else ok('normalizeTitle');

const ov = titleOverlapScore('John Wick 4', 'John Wick 3');
if (!(ov > 0.5 && ov < 1)) fail('titleOverlap Wick ' + ov);
else ok('titleOverlapScore Wick=' + ov.toFixed(2));

if (titleOverlapScore('John Wick 4', 'Kung Fu Panda 4') !== 0) {
  fail('pure number overlap should be 0');
} else ok('numeric-only overlap rejected');

const loc = localizedTitleOverlapScore(
  { uz: 'John Wick', ru: 'Джон Уик' },
  { uz: 'John Wick 4', ru: 'Джон Уик 4' }
);
if (!(loc > 0)) fail('localized overlap');
else ok('localizedTitleOverlapScore');

const m8001 = movies.find((m) => m.id === 8001);
if (!genresOf(m8001).length) fail('genresOf empty');
else ok('genresOf');
if (!actorsOf(m8001).length) fail('actorsOf empty');
else ok('actorsOf');
if (!countriesOf(m8001).length) fail('countriesOf empty');
else ok('countriesOf');
if (yearOf(m8001) !== 2023) fail('yearOf');
else ok('yearOf 2023');
if (!directorOf(m8001)) fail('directorOf empty');
else ok('directorOf');

const a = m8001;
const b = movies.find((m) => m.id === 8002);
const score = computeGeneralSimilarity(a, b);
if (!(score > 0)) fail('general score 8001vs8002=' + score);
else ok('computeGeneralSimilarity=' + score.toFixed(3));

const twin = {
  ...b,
  id: 999888,
  actors: [...(a.actors || [])],
  genre: a.genre,
  filterGenre: a.filterGenre,
  specs: a.specs,
  filterCountry: a.filterCountry,
  description: a.description,
  title: { uz: 'Twin Test', ru: 'Twin' },
  franchiseMovieIds: [],
};
const actorScore = computeGeneralSimilarity(a, twin);
const weak = computeGeneralSimilarity(a, {
  ...twin,
  actors: [99999],
  genre: { uz: ['Comedy'], ru: [] },
  filterGenre: ['Comedy'],
  specs: { year: 1990, countries: ['JP'] },
  filterCountry: 'JP',
  description: { uz: { director: 'X' }, ru: {} },
});
if (!(actorScore > weak)) fail('signals not differentiating');
else ok('genre/actor/country/year affect score');

const rows1 = buildSimilarMovies(m8001, movies, { limit: 20 });
const franch = rows1.filter((r) => r.layer === L.franchise);
if (franch[0]?.movieId !== 8004 || franch[1]?.movieId !== 8005) fail('L1 order');
else ok('L1 franchise order [8004,8005]');
if (rows1[0].layer !== L.franchise) fail('L1 not on top');
else ok('L1 on top');

let last = -1;
const orderMap = { [L.franchise]: 0, [L.nameGenre]: 1, [L.general]: 2 };
let mixed = false;
for (const r of rows1) {
  const o = orderMap[r.layer];
  if (o < last) {
    mixed = true;
    fail('layer mix at pos ' + r.position);
    break;
  }
  last = o;
}
if (!mixed) ok('layers monotonic 1→2→3');

const sequel = {
  id: 999777,
  title: { uz: 'John Wick Legacy', ru: 'Джон Уик Legacy' },
  franchiseMovieIds: [],
  genre: m8001.genre,
  filterGenre: m8001.filterGenre,
  actors: [99],
  specs: { year: 2015, countries: ['USA'] },
  filterCountry: 'USA',
  description: { uz: { director: 'Other', year: 2015 }, ru: {} },
  category: m8001.category,
};
const rows2 = buildSimilarMovies(m8001, [...movies, sequel], { limit: 30 });
const hit = rows2.find((r) => r.movieId === 999777 && r.layer === L.nameGenre);
if (!hit) fail('L2 name+genre missed sequel');
else ok('L2 name+genre matched sequel at pos ' + hit.position);
if (hit && hit.position <= franch.length) fail('L2 before L1');
else if (hit) ok('L2 after L1');

const wrong = {
  ...sequel,
  id: 999776,
  title: { uz: 'John Wick Fake', ru: 'x' },
  filterGenre: ['Komediya'],
  genre: { uz: ['Komediya'], ru: [] },
};
const rowsWrong = buildSimilarMovies(m8001, [...movies, wrong], { limit: 30 });
if (rowsWrong.some((r) => r.movieId === 999776)) fail('L2 GATE failed');
else ok('L2 GATE rejects no common genre');

const emptyF = { ...movies.find((m) => m.id === 8002), franchiseMovieIds: [] };
const rEmpty = buildSimilarMovies(emptyF, movies, { limit: 8 });
if (rEmpty.some((r) => r.layer === L.franchise)) fail('empty franchise L1');
else ok('empty franchise skips L1');

const noG = {
  id: 999001,
  title: { uz: 'John Wick Test', ru: 'John Wick Test' },
  franchiseMovieIds: [],
  genre: { uz: [], ru: [] },
  filterGenre: [],
  actors: [1],
  specs: { year: 2020, countries: ['USA'] },
  filterCountry: 'USA',
  description: { uz: {}, ru: {} },
};
const rNoG = buildSimilarMovies(noG, [...movies, noG], { limit: 8 });
if (rNoG.some((r) => r.layer === L.nameGenre)) fail('no genre L2');
else ok('no genre skips L2');

if (rows1.some((r) => r.movieId === 8001)) fail('self in results');
else ok('self excluded');

const many = { ...m8001, franchiseMovieIds: [8004, 8005, 8002, 8003] };
const rMany = buildSimilarMovies(many, movies, { limit: 2 });
const fMany = rMany.filter((r) => r.layer === L.franchise);
if (fMany.length < 4) fail('franchise truncated ' + fMany.length);
else ok('franchise not cut by limit (' + fMany.length + ')');

// API route only cache
const ctrlSrc = fs.readFileSync(
  path.join(__dirname, '../movie-similar/controllers/similar.controller.js'),
  'utf8'
);
if (/buildSimilarMovies/.test(ctrlSrc)) fail('API calls engine (must be cache-only)');
else ok('API cache-only (no engine in controller)');

console.log('\n--- SUMMARY ---');
if (errors.length) {
  console.log('FAILED ' + errors.length + ': ' + errors.join(' | '));
  process.exit(1);
}
console.log('ALL CHECKS PASSED');
process.exit(0);
