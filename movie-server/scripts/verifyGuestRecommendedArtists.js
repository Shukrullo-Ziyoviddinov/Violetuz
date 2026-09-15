'use strict';

/**
 * Guest recommended-artists verify (no Mongo required for steps 1–3).
 * Run: node scripts/verifyGuestRecommendedArtists.js
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
} = require('../recommendation-artists/services/guestArtistScoreBuilder.service');
const { scoringWeights } = require('../recommendation-artists/config/scoringWeights');

const content = (ct, id, artistId) => ({
  id,
  contentType: ct,
  contentKey: `${ct}:${id}`,
  artistId,
});

const contentsByKey = new Map([
  ['music:1', content('music', 1, 10)],
  ['music:2', content('music', 2, 10)],
  ['clip:3', content('clip', 3, '10')],
  ['album:4', content('album', 4, 50)],
  ['concert:5', content('concert', 5, 10)],
]);

const now = Date.now();
const mk = (m, ct, i, r = 0.5) => ({ m, ct, r, t: now - i * 1000 });

console.log('\n=== 1) Guest artist scores (memory, no DB) ===');

const empty = buildFromLocalHistory([], { contentsByKey, nowMs: now });
assert(empty.ok, 'empty history ok');
assert(empty.artists.length === 0, 'empty → 0 artists');

const one = buildFromLocalHistory([mk(1, 'music', 0)], {
  contentsByKey,
  nowMs: now,
});
assert(one.ok && one.artists.length === 0, '1 content → artist chiqmasin (minScore)');
assert(one.creditedContentCount === 1, '1 content still credited');

const two = buildFromLocalHistory([mk(1, 'music', 0), mk(2, 'music', 1)], {
  contentsByKey,
  nowMs: now,
});
assert(two.artists.length === 1, '2 distinct contents → 1 artist');
assert(
  two.artists[0].artistId === '10' && two.artists[0].score === 2,
  'shared artist score=2'
);

const cross = buildFromLocalHistory(
  [mk(1, 'music', 0), mk(3, 'clip', 1)],
  { contentsByKey, nowMs: now }
);
assert(
  cross.artists[0].artistId === '10' && cross.artists[0].score === 2,
  'music+clip same artist stacks'
);

const three = buildFromLocalHistory(
  [mk(1, 'music', 0), mk(2, 'music', 1), mk(5, 'concert', 2)],
  { contentsByKey, nowMs: now }
);
assert(
  three.artists[0].score === 3,
  '3 contents → artist score=3'
);

const rewatch = buildFromLocalHistory(
  [mk(1, 'music', 0), mk(1, 'music', 1, 0.9), mk(2, 'music', 2)],
  { contentsByKey, nowMs: now }
);
assert(
  rewatch.creditedContentCount === 2 && rewatch.artists[0].score === 2,
  'rewatch same contentKey once'
);

assert(
  !buildFromLocalHistory([{ m: 1, ct: 'nope', r: 0.5, t: now }], {
    contentsByKey,
  }).ok,
  'forged / invalid contentType reject'
);
assert(
  !buildFromLocalHistory([{ m: '   ', ct: 'music', r: 0.5, t: now }], {
    contentsByKey,
  }).ok,
  'forged / invalid contentId reject'
);
assert(
  !buildFromLocalHistory(
    new Array(guestHistoryConfig.MAX_ENTRIES + 1).fill(mk(1, 'music', 0))
  ).ok,
  'rejects over MAX_ENTRIES'
);

const unknown = buildFromLocalHistory(
  [mk(99, 'music', 0), mk(1, 'music', 1), mk(2, 'music', 2)],
  { contentsByKey, nowMs: now }
);
assert(
  unknown.ok &&
    unknown.skippedUnknownContents === 1 &&
    unknown.artists[0]?.artistId === '10',
  'unknown catalog id skipped; valid contents still score'
);

assert(
  (scoringWeights.minContentCount ?? 2) === 2,
  'login minContentCount=2 parity'
);

console.log('\n=== 2) Login oqimi intact ===');
const ctrl = require('../recommendation-artists/controllers');
assert(typeof ctrl.listRecommendedArtists === 'function', 'login GET handler exists');
assert(typeof ctrl.postGuestRecommendedArtists === 'function', 'guest POST handler exists');
assert(typeof ctrl.listTrendingArtists === 'function', 'trending intact');
assert(
  typeof require('../recommendation-artists/services/artistWatchCount.service')
    .getRecommendedArtists === 'function',
  'login getRecommendedArtists intact'
);
assert(
  typeof require('../recommendation-artists/services/artistWatchCount.service')
    .applyCreditsFromListenedContent === 'function',
  'login applyCredits intact'
);

const routes = require('../recommendation-artists/routes');
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
const api = fs.readFileSync(path.join(root, 'api/recommendedArtistsApi.js'), 'utf8');
const hook = fs.readFileSync(
  path.join(root, 'hooks/useRecommendedArtistsRanking.js'),
  'utf8'
);
const ui = fs.readFileSync(
  path.join(root, 'Music/RecommendedArtists/RecommendedArtists.jsx'),
  'utf8'
);
const musicStore = fs.readFileSync(
  path.join(root, 'utils/localStorage/guestHistory/musicGuestHistory.js'),
  'utf8'
);

assert(
  musicStore.includes('violet_guest_music_v1'),
  'reuses violet_guest_music_v1 (no new key)'
);
assert(
  authModal.includes('clearGuestMusicListenHistory()'),
  'register clears music guest history'
);
assert(
  authCtx.includes('clearGuestMusicListenHistory()'),
  'logout clears music guest history'
);
assert(api.includes('/recommended-artists/guest'), 'FE guest POST path');
assert(api.includes('fetchRecommendedArtists'), 'FE login GET kept');
assert(api.includes('fetchViewerRecommendedArtists'), 'FE viewer switch');
assert(
  hook.includes('fetchViewerRecommendedArtists') &&
    hook.includes('GUEST_MUSIC_HISTORY_CHANGED') &&
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
  ui.includes('mergeArtistsByPersonalAndTrending'),
  'merge personal → trending intact'
);

console.log('\n=== Qo‘lda checklist ===');
console.log('  [ ] Mehmon: 2 trek/clip (bir artist) → Tavsiya etilgan artistlar yuqorisida');
console.log('  [ ] Tarix clear (logout/register) → yana trending og‘irligi');
console.log('  [ ] Login user: GET path / DB credit o‘zgarmagan');

console.log('\nALL GUEST RECOMMENDED-ARTISTS VERIFICATION PASSED');
