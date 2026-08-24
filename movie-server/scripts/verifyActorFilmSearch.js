/**
 * Aktyor → kino search tekshiruv.
 * node movie-server/scripts/verifyActorFilmSearch.js
 */

const fs = require('fs');
const path = require('path');
const { parseMovieSearchFacets } = require('../utils/searchFacets');
const { rankAllResults } = require('../utils/searchAlgorithm');
const { resolveNeededScopes } = require('../services/search.service');

const actors = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/actors.json'), 'utf8')
).map((a) => ({
  id: a.id,
  name: a.name,
  image: a.image,
}));

const movies = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/movie.json'), 'utf8')
).map((m) => ({
  id: m.id,
  title: m.title,
  filterCountry: m.filterCountry,
  filterGenre: m.filterGenre,
  actors: m.actors,
  specs: m.specs ? { year: m.specs.year, countries: m.specs.countries } : undefined,
  homeImg: m.homeImg,
  category: m.category,
  ageRestriction: m.ageRestriction,
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
  actors,
  movies,
  music: [],
  albums: [],
  clips: [],
  concerts: [],
  musicArtists: [],
};

// Facet: noise stripped
const f1 = parseMovieSearchFacets('leonardo dicaprio kinolari');
ok('leonardo kinolari tokens', f1.titleTokens.includes('leonardo') && f1.titleTokens.includes('dicaprio'));

const f2 = parseMovieSearchFacets('leonardo uynagan kinolari');
ok('uynagan stripped', f2.titleTokens.join(' ') === 'leonardo' || f2.titleTokens.includes('leonardo'));
ok('uynagan not token', !f2.titleTokens.includes('uynagan'));

const f3 = parseMovieSearchFacets('leonardo bosh ruldagi kinolari');
ok('bosh ruldagi stripped', !f3.titleTokens.includes('bosh') && !f3.titleTokens.includes('ruldagi'));
ok('name kept', f3.titleTokens.includes('leonardo'));

const f4 = parseMovieSearchFacets('korea kinolari');
ok('korea not actor tokens', f4.titleTokens.length === 0 && f4.countryTargets.includes('Korea'));

// Scope
ok(
  'scope leonardo kinolari actors+movies',
  JSON.stringify(resolveNeededScopes('leonardo dicaprio kinolari')) ===
    JSON.stringify({ movies: true, actors: true })
);
ok(
  'scope korea movies-only',
  JSON.stringify(resolveNeededScopes('korea kinolari')) === JSON.stringify({ movies: true })
);

// Rank
const r1 = rankAllResults('leonardo dicaprio kinolari', cols);
ok('actors returned', r1.actors.length > 0, `n=${r1.actors.length}`);
ok(
  'actor is leonardo',
  r1.actors.some((a) => String(a.name?.uz || '').toLowerCase().includes('leonardo'))
);
ok('movies linked', r1.movies.length > 0, `n=${r1.movies.length}`);
ok(
  'all movies have actor id',
  r1.movies.every((m) =>
    (m.actors || []).some((id) => r1.actors.some((a) => String(a.id) === String(id)))
  )
);
ok('no music pollution', r1.music.length === 0 && r1.clips.length === 0);

const r2 = rankAllResults('leonardo uynagan bosh ruldagi kinolari', cols);
ok('role phrasing same as kinolari', r2.actors.length > 0 && r2.movies.length > 0, `movies=${r2.movies.length}`);

const r3 = rankAllResults('korea kinolari', cols);
ok('korea no fake actors', r3.actors.length === 0);
ok('korea movies ok', r3.movies.length > 0, `n=${r3.movies.length}`);

const r4 = rankAllResults('john wick kinolari', cols);
ok(
  'unknown actor falls back title or empty actors',
  r4.actors.length === 0,
  `movies=${r4.movies.length}`
);

console.log(`\nTOTAL FAILS: ${fail}`);
process.exit(fail ? 1 : 0);
