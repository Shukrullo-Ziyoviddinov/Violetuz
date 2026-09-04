/**
 * Recommendation engine edge-case verification (pure unit checks, no Mongo).
 *
 * Covers:
 *  - cold-start fallback
 *  - single-watch personalization (additive, not filter)
 *  - rewatch / duplicate boost dampening
 *  - empty actors/country/genre → 0 (no throw)
 *  - average (not sum) for multi-value dimensions
 *  - decay clamp
 *  - diversity: popular actor cannot dominate Top-N (>40%)
 *
 * Run: node scripts/verifyRecommendationEngine.js
 *   or: npm run verify:recommendations
 */

'use strict';

const {
  scoringWeights,
  dimensions,
  extractAllDimensionValues,
  scoreDimension,
  scoreAllDimensions,
  scoreMovie,
  scoreMovies,
  scoreColdStart,
  diversifyRecommendations,
  measureDiversityShares,
  utils,
  services,
} = require('../recommendation');

const {
  applyDecay,
  reinforceAffinity,
  computeWatchBoost,
  averageAffinity,
  toStringList,
  makeComboKey,
} = utils;

const { resolveBoost } = services;

let fail = 0;

const ok = (name, cond, extra = '') => {
  if (!cond) {
    fail += 1;
    console.error(`FAIL  ${name}${extra ? ` — ${extra}` : ''}`);
    return;
  }
  console.log(`ok    ${name}${extra ? ` — ${extra}` : ''}`);
};

const almost = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

/** Synthetic catalog */
const makeMovie = (overrides) => ({
  id: 1,
  categoryName: 'actionMovies',
  filterGenre: ['Jangari'],
  filterCountry: 'India',
  actors: [7],
  rating: 7,
  like: '100',
  releaseYear: 2020,
  ...overrides,
});

const catalog = [
  makeMovie({
    id: 1,
    filterGenre: ['Jangari'],
    filterCountry: 'India',
    actors: [7],
    like: '200',
    rating: 8,
  }),
  makeMovie({
    id: 2,
    filterGenre: ['Drama'],
    filterCountry: 'USA',
    actors: [9],
    like: '50000',
    rating: 9,
    releaseYear: 2024,
  }),
  makeMovie({
    id: 3,
    filterGenre: ['Romantika'],
    filterCountry: 'India',
    actors: [7],
    like: '150',
    rating: 7,
  }),
  makeMovie({
    id: 4,
    filterGenre: ['Jangari'],
    filterCountry: 'Korea',
    actors: [11],
    like: '300',
    rating: 7.5,
  }),
  makeMovie({
    id: 5,
    filterGenre: null,
    filterCountry: '',
    actors: [],
    like: '10',
    rating: 6,
  }),
];

console.log('\n=== 1) Dimension registry / empty fields ===');
ok('builtin dimensions count >= 5', dimensions.length >= 5, String(dimensions.length));
ok(
  'dimension types include genre/country/actor/combos',
  ['genre', 'country', 'actor', 'genre_country', 'genre_actor'].every((t) =>
    dimensions.some((d) => d.type === t)
  )
);

const emptyExtract = extractAllDimensionValues(
  makeMovie({ filterGenre: null, filterCountry: undefined, actors: [] })
);
ok('empty actors → []', Array.isArray(emptyExtract.actor) && emptyExtract.actor.length === 0);
ok('empty country → []', Array.isArray(emptyExtract.country) && emptyExtract.country.length === 0);
ok('empty genre → []', Array.isArray(emptyExtract.genre) && emptyExtract.genre.length === 0);
ok(
  'empty movie dimensionScore = 0 (no throw)',
  scoreDimension(dimensions.find((d) => d.type === 'actor'), makeMovie({ actors: null }), {
    actor: { '7': 5 },
  }) === 0
);

console.log('\n=== 2) Average affinity (not sum) ===');
ok(
  'average of [2,0] over 2 values = 1',
  almost(averageAffinity(['a', 'b'], { a: 2 }), 1)
);
ok(
  'multi-actor movie does not sum affinities',
  (() => {
    const movie = makeMovie({ actors: [1, 2, 3] });
    const dim = dimensions.find((d) => d.type === 'actor');
    const score = scoreDimension(dim, movie, { actor: { '1': 3, '2': 3, '3': 3 } });
    return almost(score, 3);
  })()
);

console.log('\n=== 3) Cold-start ===');
const cold = scoreColdStart(catalog, { includeBreakdown: true });
ok('cold-start returns all candidates', cold.length === catalog.length);
ok(
  'cold-start marks coldStart',
  cold.every((x) => x.coldStart === true)
);
ok(
  'cold-start never empty / never NaN',
  cold.length > 0 && cold.every((x) => Number.isFinite(x.score))
);
ok(
  'cold-start prefers popular/high-rated (id 2 near top)',
  cold[0].movie.id === 2,
  `top=${cold[0].movie.id} score=${cold[0].score.toFixed(3)}`
);

console.log('\n=== 4) Single-watch additive personalization (not filter) ===');
/** User watched Don-like: Shohruxxon(7) + India + Jangari */
const affinityAfterOneWatch = {
  genre: { Jangari: 2 },
  country: { India: 2 },
  actor: { '7': 2 },
  genre_country: { 'India::Jangari': 3 },
  genre_actor: { 'Jangari::7': 3 },
};

const warm = scoreMovies(catalog, {
  affinityMap: affinityAfterOneWatch,
  includeBreakdown: true,
});

const byId = Object.fromEntries(warm.map((x) => [x.movie.id, x]));

ok('single-watch: scoring runs', warm.length === catalog.length);
ok(
  'combo India+Jangari+actor7 ranks above unrelated popular (1 > 2)',
  byId[1].score > byId[2].score,
  `s1=${byId[1].score.toFixed(2)} s2=${byId[2].score.toFixed(2)}`
);
ok(
  'actor-only signal: India romantika with actor 7 still elevated (3 > 2)',
  byId[3].score > byId[2].score,
  `s3=${byId[3].score.toFixed(2)} s2=${byId[2].score.toFixed(2)}`
);
ok(
  'genre-only signal: Korea Jangari (no India/actor7) still elevated (4 > 5)',
  byId[4].score > byId[5].score,
  `s4=${byId[4].score.toFixed(2)} s5=${byId[5].score.toFixed(2)}`
);
ok(
  'empty-meta movie still scores (popularity path, no throw)',
  Number.isFinite(byId[5].score)
);
ok(
  'NOT a hard filter: movie without actor 7 still in list',
  warm.some((x) => x.movie.id === 4 && !String(x.movie.actors).includes('7'))
);

console.log('\n=== 5) Rewatch / duplicate boost dampening ===');
const firstBoost = resolveBoost({ completionRate: 1, liked: true }, 0);
const rewatchBoost = resolveBoost({ completionRate: 1, liked: true }, 1);
const thirdBoost = resolveBoost({ completionRate: 1, liked: true }, 2);
ok('first watch boost > 0', firstBoost > 0, String(firstBoost));
ok('rewatch boost < first', rewatchBoost < firstBoost, `${rewatchBoost} < ${firstBoost}`);
ok('third watch boost ≤ rewatch', thirdBoost <= rewatchBoost + 1e-9);
ok(
  'capWatchBoost bounds reinforce',
  (() => {
    const next = reinforceAffinity(9.5, 100);
    return next <= scoringWeights.decay.maxScore && next >= scoringWeights.decay.minScore;
  })()
);

console.log('\n=== 6) Decay clamp ===');
const decayedOld = applyDecay(8, new Date(Date.now() - 200 * 864e5));
const decayedFresh = applyDecay(8, new Date());
ok('old affinity fades but ≥ minScore', decayedOld >= scoringWeights.decay.minScore);
ok('old affinity < fresh', decayedOld < decayedFresh);
ok(
  'decay never negative / never NaN',
  Number.isFinite(decayedOld) && decayedOld >= 0
);
ok(
  'applyDecay(0) stays 0',
  applyDecay(0, new Date(Date.now() - 1000 * 864e5)) === 0
);

console.log('\n=== 7) Combo keys ===');
ok(
  'country::genre combo',
  makeComboKey('India', 'Jangari') === `India${scoringWeights.comboSeparator}Jangari`
);
ok('empty combo side → empty string', makeComboKey('', 'Jangari') === '');
ok(
  'extract genre_country for Don-like',
  extractAllDimensionValues(catalog[0]).genre_country.includes('India::Jangari')
);

console.log('\n=== 8) Diversity — popular actor cannot dominate Top-N ===');
const starId = 'Shohruxxon';
const scoredStarHeavy = [];
for (let i = 1; i <= 60; i += 1) {
  const isStar = i <= 35;
  scoredStarHeavy.push({
    movie: makeMovie({
      id: i,
      actors: isStar ? [starId] : [`Other${i}`],
      filterCountry: `C${i % 10}`,
      filterGenre: ['Jangari'],
      like: String(isStar ? 10000 - i : 1000 - i),
    }),
    score: isStar ? 300 - i : 100 - i * 0.4,
  });
}
scoredStarHeavy.sort((a, b) => b.score - a.score);

const topN = 20;
const diversified = diversifyRecommendations(scoredStarHeavy, { limit: topN });
const shares = measureDiversityShares(diversified);
const maxActorAllowed = scoringWeights.diversity.maxSharePerActor;

ok('diversity returns Top-N', diversified.length === topN);
ok(
  `max actor share ≤ ${maxActorAllowed} (Shohruxxon case)`,
  shares.maxActorShare <= maxActorAllowed + 1e-9,
  `share=${shares.maxActorShare.toFixed(3)} count=${shares.actorShares[starId] || 0}`
);
ok(
  'list still includes non-star titles',
  diversified.some((x) => !toStringList(x.movie.actors).includes(starId))
);
ok(
  'without diversity, star would dominate',
  (() => {
    const rawTop = scoredStarHeavy.slice(0, topN);
    const rawShares = measureDiversityShares(rawTop);
    return rawShares.maxActorShare > maxActorAllowed;
  })()
);

console.log('\n=== 9) Watched penalty ===');
const withPenalty = scoreMovie(catalog[0], {
  affinityMap: affinityAfterOneWatch,
  watchedIds: [1],
  includeBreakdown: true,
});
const withoutPenalty = scoreMovie(catalog[0], {
  affinityMap: affinityAfterOneWatch,
  watchedIds: [],
  includeBreakdown: true,
});
ok(
  'watched movie gets penalty',
  withPenalty.score < withoutPenalty.score,
  `pen=${withPenalty.breakdown.watchedPenalty}`
);

console.log('\n=== 10) Weighted dimension loop (generic) ===');
const { total, byType } = scoreAllDimensions(catalog[0], affinityAfterOneWatch);
ok('scoreAllDimensions total > 0', total > 0, String(total.toFixed(3)));
ok('byType has all registered dims', dimensions.every((d) => d.type in byType));
ok(
  'weights from config (combo > singles roughly)',
  scoringWeights.comboGenreCountry > scoringWeights.genre &&
    scoringWeights.comboGenreActor > scoringWeights.actor * 0.5
);

console.log('\n=== 11) Module smoke ===');
ok('scoringWeights.topN > 0', scoringWeights.topN > 0);
ok('candidatePoolSize >= topN', scoringWeights.candidatePoolSize >= scoringWeights.topN);
ok(
  'movie field mapping',
  scoringWeights.movieFields.genres === 'filterGenre' &&
    scoringWeights.movieFields.country === 'filterCountry' &&
    scoringWeights.movieFields.actors === 'actors' &&
    scoringWeights.movieFields.category === 'categoryName'
);

console.log(`\n${fail === 0 ? 'ALL PASSED' : `FAILED: ${fail}`}\n`);
process.exit(fail === 0 ? 0 : 1);
