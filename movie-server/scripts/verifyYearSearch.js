/**
 * Year facet 1–5 qadam + bog'liq joylar birgalikda tekshiruv.
 * Ishga tushirish: node movie-server/scripts/verifyYearSearch.js
 */

const fs = require('fs');
const path = require('path');
const { parseYearFacet, stripYearTokens } = require('../utils/searchYearFacets');
const { parseMovieSearchFacets } = require('../utils/searchFacets');
const { parseContentType } = require('../utils/searchContentType');
const {
  rankAllResults,
  paginateRankedResults,
  DEFAULT_LIMITS,
} = require('../utils/searchAlgorithm');
const { resolveNeededScopes } = require('../services/search.service');
const { MOVIE_SEARCH_PROJECTION } = require('../utils/searchProjections');
const searchCache = require('../utils/searchQueryCache');
const { parseMusicSearchFacets } = require('../utils/searchMusicFacets');

const raw = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/movie.json'), 'utf8')
);

const movies = raw.map((m) => ({
  id: m.id,
  title: m.title,
  homeImg: m.homeImg,
  category: m.category,
  ageRestriction: m.ageRestriction,
  filterCountry: m.filterCountry,
  filterGenre: m.filterGenre,
  categoryName: m.categoryName,
  specs: m.specs ? { year: m.specs.year, countries: m.specs.countries } : undefined,
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

const isYearDesc = (list) => {
  for (let i = 1; i < list.length; i += 1) {
    const a = Number(list[i - 1].specs?.year) || 0;
    const b = Number(list[i].specs?.year) || 0;
    if (b > a) return false;
  }
  return true;
};

console.log('movies (lean):', movies.length);

// --- Projection ---
ok('projectionda description yoq', !Object.prototype.hasOwnProperty.call(MOVIE_SEARCH_PROJECTION, 'description'));
ok('projectionda specs.year bor', MOVIE_SEARCH_PROJECTION['specs.year'] === 1);

// --- 1: parseYearFacet ---
ok('yangi → recency', parseYearFacet('yangi kinolar').mode === 'recency');
ok('2024 → exact', parseYearFacet('2024 kinolari').year === 2024);
ok(
  'exact ustun yangidan',
  parseYearFacet('yangi 2024').mode === 'exact' && parseYearFacet('yangi 2024').year === 2024
);
ok('title year emas', parseYearFacet('john wick').isYearSearch === false);

// --- 2: movie facets ---
const fKorea = parseMovieSearchFacets('korea yangi kinolar');
ok(
  'korea+yangi facet',
  fKorea.countryTargets.includes('Korea') &&
    fKorea.yearMode === 'recency' &&
    fKorea.titleTokens.length === 0
);

const fUsa = parseMovieSearchFacets('amerika 2026 yil kinolari');
ok(
  'amerika+2026 facet',
  fUsa.countryTargets.includes('USA') && fUsa.year === 2026 && fUsa.titleTokens.length === 0
);

const fTitle = parseMovieSearchFacets('john wick');
ok(
  'title token saqlanadi',
  fTitle.titleTokens.includes('john') && fTitle.titleTokens.includes('wick') && !fTitle.isYearSearch
);

const stripped = stripYearTokens('amerika 2026 yil kinolari', fUsa);
ok('strip year tokens', stripped.includes('amerika') && !stripped.includes('2026') && !/\byil\b/.test(stripped));

// --- Content type + scope ---
const ctYangi = parseContentType('yangi kinolar');
ok('yangi kinolar pure movie', ctYangi.isPureTypeSearch && ctYangi.type === 'movie');

const ct2024 = parseContentType('2024 kinolari');
ok('2024 kinolari type movie', ct2024.hasTypeFilter && ct2024.type === 'movie');

ok(
  'scope yangi movies-only',
  JSON.stringify(resolveNeededScopes('yangi kinolar')) === JSON.stringify({ movies: true })
);
ok(
  'scope korea movies-only',
  JSON.stringify(resolveNeededScopes('korea yangi kinolar')) === JSON.stringify({ movies: true })
);
ok(
  'scope amerika2026 movies-only',
  JSON.stringify(resolveNeededScopes('amerika 2026 yil kinolari')) ===
    JSON.stringify({ movies: true })
);

// --- Music regression ---
const musicFacets = parseMusicSearchFacets('yangi musiqalar');
ok('music facets ishlaydi', Array.isArray(musicFacets.countryTargets));
const ctMusic = parseContentType('yangi musiqalar');
ok('yangi musiqalar pure music', ctMusic.isPureTypeSearch && ctMusic.type === 'music');
ok(
  'scope yangi musiqalar music-only',
  JSON.stringify(resolveNeededScopes('yangi musiqalar')) === JSON.stringify({ music: true })
);

// --- 3: rank ---
const rYangi = rankAllResults('yangi kinolar', { movies });
ok(
  'yangi faqat movies',
  rYangi.movies.length > 0 &&
    rYangi.actors.length === 0 &&
    rYangi.music.length === 0 &&
    rYangi.clips.length === 0,
  `n=${rYangi.movies.length}`
);
ok('yangi year DESC', isYearDesc(rYangi.movies));

const r2024 = rankAllResults('2024 kinolari', { movies });
ok(
  '2024 exact',
  r2024.movies.length > 0 && r2024.movies.every((m) => m.specs?.year === 2024),
  `n=${r2024.movies.length}`
);

const rKorea = rankAllResults('korea yangi kinolar', { movies });
ok(
  'korea filter',
  rKorea.movies.length > 0 && rKorea.movies.every((m) => m.filterCountry === 'Korea'),
  `n=${rKorea.movies.length}`
);
ok('korea year DESC', isYearDesc(rKorea.movies));

const rUsa2026 = rankAllResults('amerika 2026 yil kinolari', { movies });
ok(
  'usa 2026',
  rUsa2026.movies.length >= 1 &&
    rUsa2026.movies.every((m) => m.filterCountry === 'USA' && m.specs?.year === 2026),
  `n=${rUsa2026.movies.length}`
);

const rPlain = rankAllResults('kinolar', { movies });
ok('plain kinolar', rPlain.movies.length === movies.length, `n=${rPlain.movies.length}`);

const rGenreYear = rankAllResults('jangari 2024 kinolari', { movies });
ok(
  'jangari+2024',
  rGenreYear.movies.every((m) => m.specs?.year === 2024),
  `n=${rGenreYear.movies.length}`
);

// --- 4: pagination + cache ---
searchCache.clear();
const ranked = rankAllResults('yangi kinolar', { movies });
const cacheKey = searchCache.makeKey(['search', 'rank', 'uz', 'yangi kinolar']);
searchCache.set(cacheKey, ranked);
ok('cache hit', searchCache.get(cacheKey) === ranked);

const page1 = paginateRankedResults(searchCache.get(cacheKey), {
  section: 'movies',
  cursor: 0,
  limits: DEFAULT_LIMITS,
});
const page2 = paginateRankedResults(searchCache.get(cacheKey), {
  section: 'movies',
  cursor: page1.meta.sections.movies.nextCursor,
  limits: DEFAULT_LIMITS,
});

ok('page1 size', page1.data.movies.length === DEFAULT_LIMITS.movies);
ok('page1 hasMore', page1.meta.sections.movies.hasMore === true);
ok(
  'pages overlap yoq',
  page1.data.movies.every((a) => !page2.data.movies.some((b) => b.id === a.id))
);
ok('page2 year DESC', isYearDesc(page2.data.movies));

// --- timing ---
console.log('\n--- timing (lean movie.json) ---');
for (const q of [
  'yangi kinolar',
  '2024 kinolari',
  'korea yangi kinolar',
  'amerika 2026 yil kinolari',
]) {
  const t0 = process.hrtime.bigint();
  const rankedQ = rankAllResults(q, { movies });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log(
    `${q} → ${ms.toFixed(2)}ms | movies=${rankedQ.movies.length} | scope=${JSON.stringify(resolveNeededScopes(q))}`
  );
}

console.log(`\nTOTAL FAILS: ${fail}`);
process.exit(fail ? 1 : 0);
