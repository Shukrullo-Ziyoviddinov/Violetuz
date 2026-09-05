/**
 * Music recommendation engine verification (pure unit checks, no Mongo).
 *
 * Covers:
 *  - dimension registry (genre/country/language/artist + combos)
 *  - empty fields → [] / 0 (no throw)
 *  - 10s listen gate (+ short-track exception)
 *  - like affinity enabled only for clip/concert
 *  - cold-start + single-listen personalization (additive)
 *  - diversity artist share soft-cap
 *  - FE detail rails (SimilarSongs / RecommendedClips / AlbumsForYou) not wired
 *
 * Run: node scripts/verifyMusicRecommendationEngine.js
 *   or: npm run verify:music-recommendations
 */

'use strict';

const fs = require('fs');
const path = require('path');

const {
  scoringWeights,
  dimensions,
  extractAllDimensionValues,
  scoreDimension,
  scoreContent,
  scoreContents,
  scoreColdStart,
  diversifyRecommendations,
  utils,
  services,
} = require('../recommendation-music');

const {
  averageAffinity,
  toContentKey,
  computeListenBoost,
  applyDecay,
  reinforceAffinity,
} = utils;

const { resolveBoost, applyLikeToAffinities, applyUnlikeToAffinities } = services;
const { isEligibleProgress } = require('../recommendation-music/services/progress.service');

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

const makeContent = (overrides = {}) => {
  const contentType = overrides.contentType || 'music';
  const id = overrides.id ?? 1;
  return {
    id,
    contentType,
    contentKey: toContentKey(contentType, id),
    categoryNameMusic: 'trendMusicData',
    genre: 'pop',
    country: 'Uzbekiston',
    language: 'uz',
    artistId: 'a1',
    year: 2022,
    like: '100',
    ...overrides,
    contentKey: toContentKey(
      overrides.contentType || contentType,
      overrides.id ?? id
    ),
  };
};

const catalog = [
  makeContent({
    id: 1,
    genre: 'pop',
    country: 'Uzbekiston',
    language: 'uz',
    artistId: 'a1',
    like: '200',
    year: 2020,
  }),
  makeContent({
    id: 2,
    genre: 'rock',
    country: 'USA',
    language: 'en',
    artistId: 'a9',
    like: '50000',
    year: 2024,
  }),
  makeContent({
    id: 3,
    genre: 'pop',
    country: 'Uzbekiston',
    language: 'uz',
    artistId: 'a1',
    like: '150',
    year: 2021,
  }),
  makeContent({
    id: 4,
    genre: 'pop',
    country: 'Korea',
    language: 'ko',
    artistId: 'a2',
    like: '300',
    year: 2023,
  }),
  makeContent({
    id: 5,
    genre: '',
    country: '',
    language: '',
    artistId: '',
    like: '10',
    year: 2018,
  }),
];

console.log('\n=== 1) Music dimension registry ===');
ok('builtin dimensions count >= 7', dimensions.length >= 7, String(dimensions.length));
ok(
  'types include genre/country/language/artist/combos',
  [
    'genre',
    'country',
    'language',
    'artist',
    'genre_country',
    'genre_artist',
    'language_country',
  ].every((t) => dimensions.some((d) => d.type === t))
);
ok(
  'no movie actor dimension',
  !dimensions.some((d) => d.type === 'actor' || d.type === 'genre_actor')
);

const emptyExtract = extractAllDimensionValues(
  makeContent({ genre: null, country: undefined, language: '', artistId: null })
);
ok('empty genre → []', Array.isArray(emptyExtract.genre) && emptyExtract.genre.length === 0);
ok('empty country → []', Array.isArray(emptyExtract.country) && emptyExtract.country.length === 0);
ok('empty language → []', Array.isArray(emptyExtract.language) && emptyExtract.language.length === 0);
ok('empty artist → []', Array.isArray(emptyExtract.artist) && emptyExtract.artist.length === 0);
ok(
  'empty content dimensionScore = 0 (no throw)',
  scoreDimension(dimensions.find((d) => d.type === 'artist'), makeContent({ artistId: null }), {
    artist: { a1: 5 },
  }) === 0
);

console.log('\n=== 2) Config: 10s gate + like types ===');
ok(
  'minListenedSeconds === 10',
  scoringWeights.progress.minListenedSeconds === 10,
  String(scoringWeights.progress.minListenedSeconds)
);
ok(
  'likeEnabledTypes = clip,concert only',
  Array.isArray(scoringWeights.likeEnabledTypes) &&
    scoringWeights.likeEnabledTypes.length === 2 &&
    scoringWeights.likeEnabledTypes.includes('clip') &&
    scoringWeights.likeEnabledTypes.includes('concert') &&
    !scoringWeights.likeEnabledTypes.includes('music') &&
    !scoringWeights.likeEnabledTypes.includes('album')
);
ok(
  'music collections use music_recommendation_ prefix (config comment via model names)',
  (() => {
    const models = require('../recommendation-music/models');
    const names = [
      models.ListenEvent.collection.collectionName,
      models.UserMusicProgress.collection.collectionName,
      models.UserMusicAffinity.collection.collectionName,
      models.UserMusicRecommendation.collection.collectionName,
    ];
    return names.every((n) => String(n).startsWith('music_recommendation_'));
  })()
);

console.log('\n=== 3) Listen gate (10s) ===');
ok('9s below threshold → not eligible', isEligibleProgress(9, 0.1, 180) === false);
ok('10s → eligible', isEligibleProgress(10, 0.05, 180) === true);
ok('11s → eligible', isEligibleProgress(11, 0, null) === true);
ok(
  'short track 8s of 9s (≥80%) → eligible',
  isEligibleProgress(8, 8 / 9, 9) === true
);
ok(
  'short track 5s of 9s (<80%) → not eligible',
  isEligibleProgress(5, 5 / 9, 9) === false
);

console.log('\n=== 4) Like affinity — type gate (no Mongo write) ===');
(async () => {
  const likeMusic = await applyLikeToAffinities({
    userId: '000000000000000000000001',
    category: 'trendMusicData',
    contentType: 'music',
    contentId: 1,
    content: makeContent({ contentType: 'music', id: 1 }),
  });
  ok(
    'music like skipped',
    likeMusic.skipped === true && likeMusic.updatedCells === 0,
    likeMusic.reason || ''
  );

  const likeAlbum = await applyLikeToAffinities({
    userId: '000000000000000000000001',
    category: 'trendMusicData',
    contentType: 'album',
    contentId: 1,
    content: makeContent({ contentType: 'album', id: 1 }),
  });
  ok('album like skipped', likeAlbum.skipped === true && likeAlbum.updatedCells === 0);

  const unlikeClip = await applyUnlikeToAffinities({
    userId: '000000000000000000000001',
    category: 'trendMusicData',
    contentType: 'music',
    contentId: 1,
    content: makeContent({ contentType: 'music', id: 1 }),
  });
  ok('music unlike skipped', unlikeClip.skipped === true);

  // clip/concert pass the type gate — they would hit Mongo next; we only assert gate opens.
  ok(
    'clip is like-enabled',
    scoringWeights.likeEnabledTypes.includes('clip')
  );
  ok(
    'concert is like-enabled',
    scoringWeights.likeEnabledTypes.includes('concert')
  );

  console.log('\n=== 5) Cold-start + personalization ===');
  const cold = scoreColdStart(catalog);
  ok('cold-start returns all candidates', cold.length === catalog.length);
  ok('cold-start marks coldStart', cold.every((x) => x.coldStart === true));
  ok(
    'cold-start never NaN',
    cold.length > 0 && cold.every((x) => Number.isFinite(x.score))
  );
  ok(
    'cold-start prefers popular (id 2 near top)',
    cold[0].content.id === 2,
    `top=${cold[0].content.id} score=${cold[0].score.toFixed(3)}`
  );

  const affinityAfterListen = {
    genre: { pop: 2 },
    country: { Uzbekiston: 2 },
    language: { uz: 2 },
    artist: { a1: 2.5 },
    genre_country: { 'Uzbekiston::pop': 3 },
    genre_artist: { 'pop::a1': 3 },
    language_country: { 'uz::Uzbekiston': 2 },
  };

  const warm = scoreContents(catalog, { affinityMap: affinityAfterListen });
  const byId = Object.fromEntries(warm.map((x) => [x.content.id, x]));

  ok('personalized scoring runs', warm.length === catalog.length);
  ok(
    'listen affinity ranks matching pop/uz/a1 above viral rock (1 > 2)',
    byId[1].score > byId[2].score,
    `s1=${byId[1].score.toFixed(2)} s2=${byId[2].score.toFixed(2)}`
  );
  ok(
    'same artist track also elevated (3 > 2)',
    byId[3].score > byId[2].score,
    `s3=${byId[3].score.toFixed(2)}`
  );
  ok(
    'listenedPenalty lowers already-heard item',
    (() => {
      const base = scoreContent(catalog[0], { affinityMap: affinityAfterListen });
      const penalized = scoreContent(catalog[0], {
        affinityMap: affinityAfterListen,
        listenedKeys: [catalog[0].contentKey],
      });
      return penalized.score < base.score;
    })()
  );

  console.log('\n=== 6) Listen boost / decay helpers ===');
  const boost = computeListenBoost({ completionRate: 0.5, liked: false });
  ok('listen boost > 0', boost > 0, String(boost));
  const boostLiked = computeListenBoost({ completionRate: 0.5, liked: true });
  ok('liked adds boost', boostLiked > boost);
  const dampened = resolveBoost({ completionRate: 0.5 }, 3);
  ok('rewatch dampens boost', dampened < resolveBoost({ completionRate: 0.5 }, 0));
  const decayed = applyDecay(5, new Date(Date.now() - 45 * 86_400_000));
  ok('half-life ~45d halves score', almost(decayed, 2.5, 0.15), String(decayed));
  const reinforced = reinforceAffinity(1, 0.5);
  ok('reinforce increases score', reinforced > 1);

  console.log('\n=== 7) Diversity (artist share) ===');
  // Yetarli alternative artistlar bo‘lsin — tor katalogda hard cap oxirida relax qilinadi.
  const sameArtistHeavy = Array.from({ length: 20 }, (_, i) => ({
    content: makeContent({
      id: i + 1,
      artistId: i < 8 ? 'star' : `other${i}`,
      country: i % 2 === 0 ? 'Uzbekiston' : 'USA',
      genre: 'pop',
    }),
    score: 10 - i * 0.01,
  }));
  const diversified = diversifyRecommendations(sameArtistHeavy, { limit: 10 });
  const starCount = diversified.filter((x) => x.content.artistId === 'star').length;
  ok(
    'diversify keeps star under ~40% of Top-10 (≤4)',
    starCount <= 4,
    `starCount=${starCount}`
  );
  ok('diversify fills limit', diversified.length === 10);

  console.log('\n=== 8) Detail rails isolation (FE) ===');
  const feRoot = path.join(__dirname, '..', '..', 'my-movie', 'src');
  const detailFiles = [
    path.join(feRoot, 'services', 'similarSongsService.js'),
    path.join(feRoot, 'services', 'recommendedClipsService.js'),
    path.join(feRoot, 'services', 'recommendedAlbumsService.js'),
    path.join(feRoot, 'Music', 'SimilarSongs', 'SimilarSongs.jsx'),
    path.join(feRoot, 'Music', 'RecommendedClips', 'RecommendedClips.jsx'),
    path.join(feRoot, 'Music', 'AlbumsForYou', 'AlbumsForYou.jsx'),
  ];

  for (const file of detailFiles) {
    const rel = path.relative(path.join(__dirname, '..', '..'), file);
    if (!fs.existsSync(file)) {
      ok(`detail file exists: ${rel}`, false);
      continue;
    }
    const src = fs.readFileSync(file, 'utf8');
    ok(
      `${path.basename(file)} does not import musicRecommendations`,
      !/musicRecommendations|recommendation-music|music-recommendations/.test(src)
    );
  }

  const homeMusic = path.join(feRoot, 'Music', 'Music.jsx');
  if (fs.existsSync(homeMusic)) {
    const src = fs.readFileSync(homeMusic, 'utf8');
    ok(
      'Music.jsx wires home music recommendations hook',
      src.includes('useHomeMusicCategoryRecommendations')
    );
    ok(
      'Music.jsx does not import SimilarSongs',
      !src.includes('SimilarSongs') && !src.includes('RecommendedClips')
    );
  }

  console.log('\n=== Summary ===');
  if (fail > 0) {
    console.error(`\n${fail} assertion(s) failed\n`);
    process.exit(1);
  }
  console.log('\nAll music recommendation unit checks passed.\n');
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
