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
 *  - blend scale normalize, liked→experience wiring, cache invalidation
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

{
  const withMeta = diversifyRecommendations(
    [
      {
        movie: makeMovie({ id: 1, actors: ['A'], filterCountry: 'X' }),
        score: 0.9,
        alpha: 0.4,
        experienceCount: 8,
        personalizedScore: 12,
        trendingScore: 0.7,
        normalizedPersonalizedScore: 0.9,
        normalizedTrendingScore: 0.7,
        trendingSource: 'stored',
        coldStart: false,
      },
      {
        movie: makeMovie({ id: 2, actors: ['B'], filterCountry: 'Y' }),
        score: 0.5,
        alpha: 0.4,
        experienceCount: 8,
        personalizedScore: 4,
        trendingScore: 0.2,
        normalizedPersonalizedScore: 0.3,
        normalizedTrendingScore: 0.2,
        trendingSource: 'fallback',
        coldStart: true,
      },
    ],
    { limit: 2 }
  );
  ok(
    'diversity preserves blend meta (alpha / personal / trending)',
    withMeta[0]?.alpha === 0.4 &&
      withMeta[0]?.personalizedScore === 12 &&
      withMeta[0]?.trendingScore === 0.7 &&
      withMeta[0]?.experienceCount === 8 &&
      withMeta[0]?.normalizedPersonalizedScore === 0.9 &&
      withMeta[1]?.trendingSource === 'fallback' &&
      withMeta[1]?.coldStart === true
  );
}

console.log('\n=== 8b) Diversity soft penalty scales with score range ===');
{
  const { resolveEffectiveRepeatPenalty } = require('../recommendation/services/diversity.service');
  const largePool = [
    { movie: makeMovie({ id: 1 }), score: 300 },
    { movie: makeMovie({ id: 2 }), score: 100 },
  ];
  const unitPool = [
    { movie: makeMovie({ id: 1 }), score: 1 },
    { movie: makeMovie({ id: 2 }), score: 0 },
  ];
  const rangeCfg = { ...scoringWeights.diversity, penaltyScale: 'range', repeatPenalty: 0.35 };
  const absCfg = { ...scoringWeights.diversity, penaltyScale: 'absolute', repeatPenalty: 0.35 };

  const largeEff = resolveEffectiveRepeatPenalty(largePool, rangeCfg);
  const unitEff = resolveEffectiveRepeatPenalty(unitPool, rangeCfg);
  const absEff = resolveEffectiveRepeatPenalty(largePool, absCfg);

  ok('range penalty ≫ absolute on large scores', largeEff > 50, `eff=${largeEff}`);
  ok('range penalty ~ fraction of [0,1] span', Math.abs(unitEff - 0.35) < 1e-9, `eff=${unitEff}`);
  ok('absolute mode keeps raw 0.35', Math.abs(absEff - 0.35) < 1e-9, `eff=${absEff}`);

  // Soft-only: close large scores → prefer non-repeat over tiny score edge
  const softOnly = diversifyRecommendations(
    [
      {
        movie: makeMovie({ id: 1, actors: [starId], filterCountry: 'A' }),
        score: 200,
      },
      {
        movie: makeMovie({ id: 2, actors: [starId], filterCountry: 'B' }),
        score: 199,
      },
      {
        movie: makeMovie({ id: 3, actors: ['Other'], filterCountry: 'C' }),
        score: 198.5,
      },
    ],
    {
      limit: 2,
      diversity: {
        ...scoringWeights.diversity,
        maxSharePerActor: 1,
        maxSharePerCountry: 1,
        windowSize: 1,
        maxRepeatsInWindow: 99,
        penaltyScale: 'range',
        repeatPenalty: 0.35,
      },
    }
  );
  ok(
    'soft penalty picks non-star 2nd when scores are large',
    softOnly.length === 2 &&
      softOnly[0].movie.id === 1 &&
      softOnly[1].movie.id === 3,
    `order=${softOnly.map((x) => x.movie.id).join(',')}`
  );
}

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
{
  const WatchEvent = require('../recommendation/models/WatchEvent.model');
  const ttlDays = scoringWeights.watchEvent?.ttlDays;
  const ttlIdx = WatchEvent.schema.indexes().find(
    ([fields, opts]) => fields.watchedAt === 1 && opts && opts.expireAfterSeconds != null
  );
  ok('watchEvent.ttlDays configured', Number(ttlDays) > 0, `ttlDays=${ttlDays}`);
  ok(
    'WatchEvent watchedAt TTL index',
    Boolean(ttlIdx) &&
      ttlIdx[1].expireAfterSeconds === Math.floor(Number(ttlDays) * 86400),
    ttlIdx ? `expireAfterSeconds=${ttlIdx[1].expireAfterSeconds}` : 'missing'
  );
  ok(
    'TTL window ≫ trending window',
    Number(ttlDays) > Number(scoringWeights.trending?.windowDays || 30)
  );
}

console.log('\n=== 12) Confidence blending + trending ===');
const { calculateAlpha, blendScores } = services;
const { scoreTrendingBatch, resolveTrendingScore } = services;

ok('blend + trending config present', Boolean(scoringWeights.blend && scoringWeights.trending));
ok('alpha(0)=0 (100% trending)', calculateAlpha(0) === 0);
ok('alpha(5)=0.25 linear', almost(calculateAlpha(5), 0.25));
ok('alpha(20)=1 (100% personal)', calculateAlpha(20) === 1);
ok('alpha never > 1', calculateAlpha(999) === 1);
ok(
  'alpha never < 0',
  calculateAlpha(-5) === 0
);
ok(
  'per-category alpha independence (same fn, different counts)',
  calculateAlpha(0) === 0 && calculateAlpha(20) === 1
);

const expAlpha = calculateAlpha(10, {
  blend: { strategy: 'exponential', confidenceK: 10 },
});
ok('exponential alpha in (0,1)', expAlpha > 0 && expAlpha < 1, String(expAlpha.toFixed(3)));

ok('blend alpha=0 → pure trending', blendScores(10, 2, 0) === 2);
ok('blend alpha=1 → pure personal', blendScores(10, 2, 1) === 10);
ok('blend alpha=0.25', almost(blendScores(10, 2, 0.25), 4));

const { minMaxNormalizeList, normalizePersonalLone } = services;
const normP = minMaxNormalizeList([0, 10, 20]);
ok('minmax personal 0→0', almost(normP[0], 0));
ok('minmax personal mid→0.5', almost(normP[1], 0.5));
ok('minmax personal max→1', almost(normP[2], 1));
const normT = minMaxNormalizeList([0.2, 0.8]);
ok('minmax trending comparable [0,1]', almost(normT[0], 0) && almost(normT[1], 1));
ok(
  'lone personal soft-cap',
  almost(normalizePersonalLone(10, { blend: { personalNormCap: 20 } }), 0.5)
);
ok(
  'normalized blend: mid personal vs high trending at α=0.25 prefers trend side',
  (() => {
    const p = minMaxNormalizeList([2, 18]); // → 0, 1
    const t = minMaxNormalizeList([0.9, 0.1]); // → 1, 0
    // movie0: p=0,t=1 → blend@0.25 = 0.75; movie1: p=1,t=0 → 0.25
    return blendScores(p[0], t[0], 0.25) > blendScores(p[1], t[1], 0.25);
  })()
);

const trendBatch = scoreTrendingBatch([
  {
    movieId: 1,
    viewCountRecent: 100,
    avgWatchDuration: 500,
    likeCount: 50,
    completionRateAvg: 0.9,
  },
  {
    movieId: 2,
    viewCountRecent: 0,
    avgWatchDuration: 0,
    likeCount: 0,
    completionRateAvg: 0,
  },
]);
ok(
  'trending batch ranks high-signal movie first',
  trendBatch[0].trendingScore > trendBatch[1].trendingScore
);
ok(
  'missing trending → popularity fallback',
  resolveTrendingScore(null, { like: '5000' }).source === 'popularity'
);
ok(
  'stored score 0 is trending (not treated as missing)',
  resolveTrendingScore(0, { like: '5000' }).source === 'trending' &&
    resolveTrendingScore(0, { like: '5000' }).score === 0
);
ok(
  'stored popularity label preserved in blend resolve',
  resolveTrendingScore(
    { score: 0.42, source: 'popularity' },
    { like: '1' }
  ).source === 'popularity' &&
    almost(
      resolveTrendingScore({ score: 0.42, scoreSource: 'popularity' }).score,
      0.42
    )
);
{
  const { buildPopularityFallbackScores, getPopularitySignal } = (() => {
    const trending = require('../recommendation/services/trending.service');
    const { getPopularitySignal: pop } = require('../recommendation/utils/movieSignals');
    return { ...trending, getPopularitySignal: pop };
  })();
  const movie = { id: 42, like: '5000', categoryName: 'drama' };
  const rows = buildPopularityFallbackScores([movie], 'drama');
  ok('fallback row count', rows.length === 1);
  ok(
    'fallback trendingScore === popularity (not fake views)',
    almost(rows[0].trendingScore, getPopularitySignal(movie)) &&
      rows[0].viewCountRecent === 0 &&
      rows[0].avgWatchDuration === 0 &&
      rows[0].completionRateAvg === 0 &&
      rows[0].likeCount === 0 &&
      rows[0].scoreSource === 'popularity'
  );
}
ok(
  'precompute uses blending export',
  typeof services.scoreMoviesBlended === 'function' &&
    typeof services.precomputeUserCategoryRecommendations === 'function'
);

const runSection13 = async () => {
  console.log('\n=== 13) Blend scale + liked wiring + cache invalidation ===');

  const { scoreMoviesBlended } = services;
  const {
    buildQualityWatchFilter,
    unionDistinctCount,
    qualityMinCompletion,
  } = require('../recommendation/repositories/userExperience.repository');
  const { evaluateUserCacheStale } = require('../recommendation/services/serve.service');

  // --- Blend scale: without normalize personal dwarfs trending; with minmax they compete ---
  const pool = [
    makeMovie({ id: 101, like: '10', rating: 5 }),
    makeMovie({ id: 102, like: '9000', rating: 9 }),
  ];
  const affinityHeavy = {
    genre: { Jangari: 8 },
    country: { India: 8 },
    actor: { '7': 8 },
    genre_country: { 'India::Jangari': 9 },
    genre_actor: { 'Jangari::7': 9 },
  };
  const trendingMap = new Map([
    ['101', 0.95],
    ['102', 0.1],
  ]);

  const rawBlend = await scoreMoviesBlended(pool, {
    experienceCount: 5, // α=0.25
    trendingMap,
    scoreOptions: { affinityMap: affinityHeavy },
    weights: {
      ...scoringWeights,
      blend: { ...scoringWeights.blend, normalizeMode: 'none' },
    },
  });
  const normBlend = await scoreMoviesBlended(pool, {
    experienceCount: 5,
    trendingMap,
    scoreOptions: { affinityMap: affinityHeavy },
    weights: {
      ...scoringWeights,
      blend: { ...scoringWeights.blend, normalizeMode: 'minmax' },
    },
  });

  ok(
    'normalizeMode=none: blended scores not both in [0,1]',
    rawBlend.some((r) => r.score > 1.01 || r.score < 0),
    `scores=${rawBlend.map((r) => r.score.toFixed(2)).join(',')}`
  );
  ok(
    'normalizeMode=minmax: all blended scores in [0,1]',
    normBlend.every((r) => r.score >= -1e-9 && r.score <= 1 + 1e-9),
    `scores=${normBlend.map((r) => r.score.toFixed(3)).join(',')}`
  );
  ok(
    'minmax keeps normalizedPersonalizedScore / Trending in [0,1]',
    normBlend.every(
      (r) =>
        r.normalizedPersonalizedScore >= 0 &&
        r.normalizedPersonalizedScore <= 1 &&
        r.normalizedTrendingScore >= 0 &&
        r.normalizedTrendingScore <= 1
    )
  );
  // High trending + low personal (101) can beat high personal when α low + normalized
  const coldAlpha = await scoreMoviesBlended(pool, {
    experienceCount: 0, // α=0 → pure trending
    trendingMap,
    scoreOptions: { affinityMap: {} },
    weights: scoringWeights,
  });
  ok(
    'α=0 pure trending: higher trending movie ranks first',
    String(coldAlpha[0].movie.id) === '101' && coldAlpha[0].alpha === 0,
    `top=${coldAlpha[0].movie.id} α=${coldAlpha[0].alpha}`
  );
  const fullPersonal = await scoreMoviesBlended(pool, {
    experienceCount: 20,
    trendingMap,
    scoreOptions: { affinityMap: affinityHeavy },
    weights: scoringWeights,
  });
  ok(
    'α=1 uses personal signal (alpha field)',
    fullPersonal[0].alpha === 1 &&
      fullPersonal.every((r) => almost(r.score, r.normalizedPersonalizedScore)),
    `α=${fullPersonal[0].alpha}`
  );

  // --- Liked wiring: experience = DISTINCT(progress ∪ like), TTL-safe ---
  const minC = qualityMinCompletion();
  const qFilter = buildQualityWatchFilter(minC);
  ok(
    'quality progress filter is completionRate > threshold (UserMovieProgress)',
    qFilter.completionRate && qFilter.completionRate.$gt === minC
  );
  ok(
    'quality filter has no WatchEvent.liked (likes via UserReaction only)',
    qFilter.liked === undefined && !qFilter.$or
  );
  ok(
    'unionDistinctCount: like alone raises experience',
    unionDistinctCount([], [1, 2, 3]) === 3
  );
  ok(
    'unionDistinctCount: watch∪like no double-count',
    unionDistinctCount([1, 2], [2, 3]) === 3
  );
  ok(
    'unionDistinctCount: duplicate events collapse',
    unionDistinctCount([1, 1, 1], [1]) === 1
  );
  ok(
    'like-sized experience raises alpha (wiring contract)',
    calculateAlpha(unionDistinctCount([], [1, 2, 3, 4, 5])) === calculateAlpha(5)
  );
  ok(
    'blend.qualityMinCompletion configured',
    typeof scoringWeights.blend?.qualityMinCompletion === 'number' &&
      scoringWeights.blend.qualityMinCompletion > 0
  );
  ok(
    'watchedPenalty source is UserMovieProgress (cap 5000, not WatchEvent 200)',
    (() => {
      const prog = require('../recommendation/repositories/userMovieProgress.repository');
      const src = prog.listWatchedMovieIds.toString();
      return (
        typeof prog.listWatchedMovieIds === 'function' &&
        src.includes('5000') &&
        src.includes('UserMovieProgress')
      );
    })()
  );
  ok(
    'experience α uses UserMovieProgress (TTL-safe)',
    typeof require('../recommendation/repositories/userExperience.repository')
      .listQualityWatchMovieIds === 'function'
  );
  ok(
    'trending duration+views share decay-weighted WatchEvent window',
    typeof require('../recommendation/repositories/watchEvent.repository')
      .averageWatchedSecondsByCategory === 'function' &&
      require('../recommendation/repositories/watchEvent.repository')
        .averageWatchedSecondsByCategory.toString()
        .includes('halfLifeDays')
  );
  ok(
    'durable queue recover export present',
    typeof require('../recommendation/jobs').startRecommendationQueueRecovery ===
      'function'
  );

  // --- Cache invalidation (pure evaluateUserCacheStale) ---
  const t0 = Date.parse('2026-01-01T00:00:00Z');
  const hour = 3_600_000;
  ok(
    'cache missing generatedAt → stale',
    evaluateUserCacheStale({ cacheGeneratedAt: null }).reason === 'missing_generated_at'
  );
  ok(
    'cache fresh + older trending → not stale',
    evaluateUserCacheStale({
      cacheGeneratedAt: new Date(t0 + hour),
      trendingUpdatedAt: new Date(t0),
      now: t0 + hour + 60_000,
      weights: {
        trending: {
          invalidateUserCacheWhenNewer: true,
          userCacheMaxAgeMs: 7_200_000,
          precomputeIntervalMs: hour,
        },
      },
    }).stale === false
  );
  ok(
    'trending newer than cache → stale (lazy invalidate)',
    evaluateUserCacheStale({
      cacheGeneratedAt: new Date(t0),
      trendingUpdatedAt: new Date(t0 + hour),
      now: t0 + hour + 60_000,
      weights: {
        trending: {
          invalidateUserCacheWhenNewer: true,
          userCacheMaxAgeMs: 7_200_000,
          precomputeIntervalMs: hour,
        },
      },
    }).reason === 'trending_newer'
  );
  ok(
    'absolute maxAge exceeded → stale',
    evaluateUserCacheStale({
      cacheGeneratedAt: new Date(t0),
      trendingUpdatedAt: new Date(t0),
      now: t0 + 10_000_000,
      weights: {
        trending: {
          invalidateUserCacheWhenNewer: true,
          userCacheMaxAgeMs: hour,
          precomputeIntervalMs: hour,
        },
      },
    }).reason === 'max_age'
  );
  ok(
    'invalidateUserCacheWhenNewer=false ignores newer trending',
    evaluateUserCacheStale({
      cacheGeneratedAt: new Date(t0),
      trendingUpdatedAt: new Date(t0 + hour),
      now: t0 + 60_000,
      weights: {
        trending: {
          invalidateUserCacheWhenNewer: false,
          userCacheMaxAgeMs: 7_200_000,
          precomputeIntervalMs: hour,
        },
      },
    }).stale === false
  );
  ok(
    'config enables trending→cache invalidate',
    scoringWeights.trending?.invalidateUserCacheWhenNewer === true
  );
};

runSection13()
  .then(() => {
    console.log(`\n${fail === 0 ? 'ALL PASSED' : `FAILED: ${fail}`}\n`);
    process.exit(fail === 0 ? 0 : 1);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

