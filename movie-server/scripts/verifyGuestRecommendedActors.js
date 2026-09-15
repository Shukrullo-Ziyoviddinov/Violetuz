'use strict';

/**
 * Guest recommended-actors verify (no Mongo required for steps 1–3).
 * Run: node scripts/verifyGuestRecommendedActors.js
 */

const fs = require('fs');
const path = require('path');

const assert = (cond, msg) => {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('ok   ', msg);
};

const {
  buildFromLocalHistory,
  guestHistoryConfig,
} = require('../recommendation-actors/services/guestActorScoreBuilder.service');
const { scoringWeights } = require('../recommendation-actors/config/scoringWeights');

const movie = (id, actors) => ({ id, actors });

const moviesById = new Map([
  [1, movie(1, [10, 20])],
  [2, movie(2, [10, 30])],
  [3, movie(3, ['10', 40])],
  [4, movie(4, [50])],
  [5, movie(5, [10])],
]);

const now = Date.now();
const mk = (m, i, r = 0.5) => ({ m, r, t: now - i * 1000 });

console.log('\n=== 1) Guest actor scores (memory, no DB) ===');

const empty = buildFromLocalHistory([], { moviesById, nowMs: now });
assert(empty.ok, 'empty history ok');
assert(empty.actors.length === 0, 'empty → 0 actors');
assert(empty.source === 'empty' || empty.actors.length === 0, 'empty source');

const oneFilm = buildFromLocalHistory([mk(1, 0)], { moviesById, nowMs: now });
assert(oneFilm.ok && oneFilm.actors.length === 0, '1 film → actor chiqmasin (minScore)');
assert(oneFilm.creditedMovieCount === 1, '1 film still credited');

const twoFilms = buildFromLocalHistory([mk(1, 0), mk(2, 1)], {
  moviesById,
  nowMs: now,
});
assert(twoFilms.actors.length === 1, '2 distinct films → 1 actor');
assert(
  twoFilms.actors[0].actorId === '10' && twoFilms.actors[0].score === 2,
  'shared actor score=2'
);

const threeFilms = buildFromLocalHistory(
  [mk(1, 0), mk(2, 1), mk(3, 2)],
  { moviesById, nowMs: now }
);
assert(
  threeFilms.actors[0].actorId === '10' && threeFilms.actors[0].score === 3,
  '3 films → actor score=3'
);

const rewatch = buildFromLocalHistory(
  [mk(1, 0), mk(1, 1, 0.9), mk(2, 2)],
  { moviesById, nowMs: now }
);
assert(
  rewatch.creditedMovieCount === 2 && rewatch.actors[0].score === 2,
  'rewatch same movieId once'
);

assert(
  !buildFromLocalHistory([{ m: 'abc', r: 0.5, t: now }], { moviesById }).ok,
  'forged / invalid movieId reject'
);
assert(
  !buildFromLocalHistory(new Array(guestHistoryConfig.MAX_ENTRIES + 1).fill(mk(1, 0)))
    .ok,
  'rejects over MAX_ENTRIES'
);

const unknown = buildFromLocalHistory([mk(99, 0), mk(1, 1), mk(2, 2)], {
  moviesById,
  nowMs: now,
});
assert(
  unknown.ok &&
    unknown.skippedUnknownMovies === 1 &&
    unknown.actors[0]?.actorId === '10',
  'unknown catalog id skipped; valid films still score'
);

assert(
  (scoringWeights.minMovieCount ?? 2) === 2,
  'login minMovieCount=2 parity'
);

console.log('\n=== 2) Login oqimi intact ===');
const ctrl = require('../recommendation-actors/controllers');
assert(typeof ctrl.listRecommendedActors === 'function', 'login GET handler exists');
assert(typeof ctrl.postGuestRecommendedActors === 'function', 'guest POST handler exists');
assert(typeof ctrl.listTrendingActors === 'function', 'trending intact');
assert(
  typeof require('../recommendation-actors/services/actorWatchCount.service')
    .getRecommendedActors === 'function',
  'login getRecommendedActors intact'
);
assert(
  typeof require('../recommendation-actors/services/actorWatchCount.service')
    .applyCreditsFromWatchedMovie === 'function',
  'login applyCredits intact'
);

const routes = require('../recommendation-actors/routes');
const stack = routes.stack || [];
assert(
  stack.some((l) => l.route && l.route.path === '/guest' && l.route.methods.post),
  'POST /guest registered'
);
assert(
  stack.some((l) => l.route && l.route.path === '/' && l.route.methods.get),
  'GET / auth route intact'
);

console.log('\n=== 3) FE wiring (guest + clear, no new storage key) ===');
const root = path.join(__dirname, '../../my-movie/src');
const authModal = fs.readFileSync(
  path.join(root, 'components/AuthModal/AuthModal.jsx'),
  'utf8'
);
const authCtx = fs.readFileSync(path.join(root, 'context/AuthContext.jsx'), 'utf8');
const api = fs.readFileSync(path.join(root, 'api/recommendedActorsApi.js'), 'utf8');
const hook = fs.readFileSync(
  path.join(root, 'hooks/useRecommendedActorsRanking.js'),
  'utf8'
);
const ui = fs.readFileSync(
  path.join(root, 'components/RecommendedActors/RecommendedActors.jsx'),
  'utf8'
);
const movieStore = fs.readFileSync(
  path.join(root, 'utils/localStorage/guestHistory/movieGuestHistory.js'),
  'utf8'
);

assert(
  movieStore.includes('violet_guest_movies_v1'),
  'reuses violet_guest_movies_v1 (no new key)'
);
assert(
  authModal.includes('clearGuestMovieWatchHistory()'),
  'register clears movie guest history'
);
assert(
  authCtx.includes('clearGuestMovieWatchHistory()'),
  'logout clears movie guest history'
);
assert(api.includes('/recommended-actors/guest'), 'FE guest POST path');
assert(api.includes('fetchRecommendedActors'), 'FE login GET kept');
assert(api.includes('fetchViewerRecommendedActors'), 'FE viewer switch');
assert(
  hook.includes('fetchViewerRecommendedActors') &&
    hook.includes('GUEST_MOVIE_HISTORY_CHANGED') &&
    hook.includes('guestHistoryEpoch'),
  'hook guest fetch + history re-fetch'
);
assert(
  /useState\(\s*true\s*\)/.test(hook) && hook.includes('loading'),
  'hook loading starts true'
);
assert(
  ui.includes('waitingPersonalized') &&
    ui.includes('!authReady || rankingLoading'),
  'UI waits for guest+login personal ranking'
);
assert(
  ui.includes('mergeActorsByPersonalAndTrending'),
  'merge personal → trending intact'
);

console.log('\n=== Qo‘lda checklist ===');
console.log('  [ ] Mehmon: 2 film (bir aktyor) → Tavsiya etilgan aktyorlar yuqorisida');
console.log('  [ ] Tarix clear (logout/register) → yana trending og‘irligi');
console.log('  [ ] Login user: GET path / DB credit o‘zgarmagan');

console.log('\nALL GUEST RECOMMENDED-ACTORS VERIFICATION PASSED');
