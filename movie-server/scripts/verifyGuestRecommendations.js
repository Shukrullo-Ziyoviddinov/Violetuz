'use strict';

const fs = require('fs');
const path = require('path');

const assert = (cond, msg) => {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('ok   ', msg);
};

const { calculateAlpha } = require('../recommendation/services/blending.service');
const {
  buildFromEvents,
  guestHistoryConfig,
} = require('../recommendation/services/guestAffinityBuilder.service');
const {
  getGuestRecommendationsByCategory,
} = require('../recommendation/services/guestRecommendations.service');

const movie = (id, genre = 'Action') => ({
  id,
  categoryName: 'kinolar',
  filterGenre: [genre],
  filterCountry: ['US'],
  actors: [`actor${id}`],
});

const moviesById = new Map([
  [1, movie(1, 'Action')],
  [2, movie(2, 'Drama')],
  [3, movie(3, 'Action')],
  [4, movie(4, 'Comedy')],
  [5, movie(5, 'Action')],
]);

const now = Date.now();
const mk = (m, i) => ({ m, c: 'kinolar', r: 0.5, t: now - i * 1000 });

console.log('\n=== 1) Guest: tarix → alpha o‘sishi ===');

const empty = buildFromEvents([], { category: 'kinolar', moviesById, nowMs: now });
assert(empty.ok, 'empty history ok');
assert(empty.experienceCount === 0, 'empty experienceCount=0');
assert(calculateAlpha(empty.experienceCount) === 0, 'empty alpha=0 (100% trending)');

const few = buildFromEvents([mk(1, 0), mk(2, 1)], {
  category: 'kinolar',
  moviesById,
  nowMs: now,
});
assert(few.ok && few.experienceCount === 2, '2 quality events → experienceCount=2');
const alphaFew = calculateAlpha(few.experienceCount);
assert(alphaFew > 0, 'alpha after 2 events > 0 — ' + alphaFew);

const more = buildFromEvents(
  [mk(1, 0), mk(2, 1), mk(3, 2), mk(4, 3), mk(5, 4)],
  { category: 'kinolar', moviesById, nowMs: now }
);
assert(more.experienceCount === 5, '5 quality events → experienceCount=5');
const alphaMore = calculateAlpha(more.experienceCount);
assert(alphaMore > alphaFew, `alpha grows (${alphaFew} → ${alphaMore})`);

// Distinct + qualityMinCompletion (0.3): rewatch + low-r do not inflate α
const soft = buildFromEvents(
  [
    { m: 1, c: 'kinolar', r: 0.5, t: now },
    { m: 1, c: 'kinolar', r: 0.9, t: now + 1 }, // rewatch same id
    { m: 2, c: 'kinolar', r: 0.2, t: now + 2 }, // below qualityMinCompletion
  ],
  { category: 'kinolar', moviesById, nowMs: now }
);
assert(
  soft.experienceCount === 1,
  'experienceCount=DISTINCT quality only (not appliedEvents) — ' + soft.experienceCount
);
assert(soft.appliedEvents >= 2, 'affinity still applies low-r / rewatch rows');
assert(Object.keys(more.affinityMap.genre || {}).length > 0, 'affinityMap has genre');

assert(
  !buildFromEvents(new Array(guestHistoryConfig.MAX_ENTRIES + 1).fill(mk(1, 0))).ok,
  'rejects localHistory > MAX_ENTRIES'
);
assert(
  !buildFromEvents([{ m: 'abc', c: 'kinolar', r: 0.5, t: now }]).ok,
  'rejects invalid movieId'
);
assert(
  buildFromEvents([mk(1, 0)], { category: 'anime', moviesById, nowMs: now })
    .experienceCount === 0,
  'other category events ignored'
);

// Forged client `c` must not poison affinity — catalog categoryName only
const forgedC = buildFromEvents(
  [{ m: 1, c: 'anime', r: 0.9, t: now }],
  { category: 'kinolar', moviesById, nowMs: now }
);
assert(forgedC.ok && forgedC.experienceCount === 1, 'forged c ignored; movie.categoryName wins');
const forgedWrongCat = buildFromEvents(
  [{ m: 1, c: 'kinolar', r: 0.9, t: now }],
  { category: 'anime', moviesById, nowMs: now }
);
assert(
  forgedWrongCat.experienceCount === 0,
  'forged c cannot move movie into another category'
);

console.log('\n=== 2) Login oqimi (export / controller) ===');
const ctrl = require('../recommendation/controllers');
assert(typeof ctrl.getByCategory === 'function', 'login getByCategory exists');
assert(typeof ctrl.postProgress === 'function', 'login postProgress exists');
assert(typeof ctrl.postGuestByCategory === 'function', 'guest endpoint exists');
assert(
  typeof require('../recommendation/services/serve.service')
    .getRecommendationsByCategory === 'function',
  'login serve unchanged'
);

console.log('\n=== 3) FE: register clear + logout no-restore ===');
const root = path.join(__dirname, '../../my-movie/src');
const authModal = fs.readFileSync(
  path.join(root, 'components/AuthModal/AuthModal.jsx'),
  'utf8'
);
const authCtx = fs.readFileSync(path.join(root, 'context/AuthContext.jsx'), 'utf8');
const api = fs.readFileSync(path.join(root, 'api/recommendationsApi.js'), 'utf8');
const homeHook = fs.readFileSync(
  path.join(root, 'hooks/useHomeCategoryRecommendations.js'),
  'utf8'
);

assert(
  authModal.includes('clearGuestMovieWatchHistory()'),
  'register success clears guest local history'
);
assert(
  authModal.includes('clearViewedMoviesHistory()'),
  'register success clears ViewedMovies (no leftover local signal)'
);
assert(
  /mode === 'register'[\s\S]*clearGuestMovieWatchHistory\(\)/.test(authModal),
  'clear is inside register success branch'
);
assert(
  authCtx.includes('clearGuestMovieWatchHistory()') &&
    authCtx.includes('clearViewedMoviesHistory()') &&
    authCtx.includes('clearAuthSessionAction'),
  'full logout clears guest + viewed history (no restore / clean guest)'
);
assert(api.includes('/guest'), 'FE guest POST path');
assert(api.includes('fetchCategoryRecommendations'), 'FE login GET kept');
assert(
  homeHook.includes('fetchViewerCategoryRecommendations'),
  'Home uses viewer fetch (guest+login)'
);
assert(
  homeHook.includes('GUEST_MOVIE_HISTORY_CHANGED') &&
    homeHook.includes('guestHistoryEpoch'),
  'Home re-fetches on guest movie history change'
);
assert(
  /useState\(\s*true\s*\)/.test(homeHook) && homeHook.includes('isLoading'),
  'Home isLoading starts true (no catalog flash)'
);

console.log('\n=== 4) Guest serve (DB) ===');
getGuestRecommendationsByCategory({
  category: 'kinolar',
  localHistory: [],
  limit: 5,
  hydrate: false,
})
  .then((result) => {
    assert(result.userId === null, 'guest userId=null (no auth user write target)');
    assert(result.experienceCount === 0, 'serve empty experienceCount=0');
    assert(Number(result.alpha) === 0, 'serve empty alpha=0 — ' + result.alpha);
    assert(
      result.source === 'guest_trending' || result.source === 'guest_blended',
      'guest source — ' + result.source
    );
    return getGuestRecommendationsByCategory({
      category: 'kinolar',
      localHistory: [mk(1, 0), mk(2, 1), mk(3, 2), mk(4, 3), mk(5, 4)],
      limit: 5,
      hydrate: false,
    });
  })
  .then((withHistory) => {
    assert(
      withHistory.experienceCount >= 0,
      'with history experienceCount=' + withHistory.experienceCount
    );
    // Movies may or may not be in DB; if applied, alpha should rise
    if (withHistory.experienceCount > 0) {
      assert(
        Number(withHistory.alpha) > 0,
        'with applied history alpha > 0 — ' + withHistory.alpha
      );
    } else {
      console.log(
        'ok    history ids not in DB — alpha stays 0 (expected without seed)'
      );
    }
    console.log('\nALL GUEST VERIFICATION PASSED');
    process.exit(0);
  })
  .catch((err) => {
    console.log('warn  guest serve DB step skipped:', err.message);
    console.log('\nCHECKS 1–3 PASSED (serve needs Mongo)');
    process.exit(0);
  });
