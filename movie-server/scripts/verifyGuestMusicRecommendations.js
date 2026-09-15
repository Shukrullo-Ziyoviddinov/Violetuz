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
} = require('../recommendation-music/services/guestAffinityBuilder.service');

const content = (id, genre = 'Pop') => ({
  id: String(id),
  contentType: 'music',
  contentKey: `music:${id}`,
  categoryNameMusic: 'pop',
  filterGenre: [genre],
  filterCountry: ['UZ'],
  language: ['uz'],
  artists: [`a${id}`],
});

const now = Date.now();
const mk = (m, i, r = 0.5) => ({
  m,
  c: 'pop',
  ct: 'music',
  r,
  t: now - i * 1000,
});

const contentsByKey = new Map([
  ['music:1', content(1)],
  ['music:2', content(2, 'Rock')],
  ['music:3', content(3)],
  ['music:4', content(4, 'Jazz')],
  ['music:5', content(5)],
]);

console.log('\n=== 1) Guest music: tarix → alpha o‘sishi ===');

const empty = buildFromEvents([], {
  category: 'pop',
  contentType: 'music',
  contentsByKey,
  nowMs: now,
});
assert(empty.ok, 'empty history ok');
assert(empty.experienceCount === 0, 'empty experienceCount=0');
assert(calculateAlpha(empty.experienceCount) === 0, 'empty alpha=0');

const few = buildFromEvents([mk(1, 0), mk(2, 1)], {
  category: 'pop',
  contentType: 'music',
  contentsByKey,
  nowMs: now,
});
assert(few.experienceCount === 2, '2 quality → experienceCount=2');
const alphaFew = calculateAlpha(few.experienceCount);
assert(alphaFew > 0, 'alpha after 2 > 0 — ' + alphaFew);

const more = buildFromEvents(
  [mk(1, 0), mk(2, 1), mk(3, 2), mk(4, 3), mk(5, 4)],
  { category: 'pop', contentType: 'music', contentsByKey, nowMs: now }
);
assert(more.experienceCount === 5, '5 quality → experienceCount=5');
const alphaMore = calculateAlpha(more.experienceCount);
assert(alphaMore > alphaFew, `alpha grows (${alphaFew} → ${alphaMore})`);

const soft = buildFromEvents(
  [mk(1, 0, 0.5), mk(1, 1, 0.9), mk(2, 2, 0.2)],
  { category: 'pop', contentType: 'music', contentsByKey, nowMs: now }
);
assert(
  soft.experienceCount === 1,
  'DISTINCT quality only (rewatch + low-r) — ' + soft.experienceCount
);
assert(soft.appliedEvents >= 2, 'affinity still applies extra rows');

// Category-wide: clip listen in same categoryNameMusic counts (login parity)
const clipDoc = {
  id: '10',
  contentType: 'clip',
  contentKey: 'clip:10',
  categoryNameMusic: 'pop',
  filterGenre: ['Pop'],
  filterCountry: ['UZ'],
  language: ['uz'],
  artists: ['clipA'],
};
contentsByKey.set('clip:10', clipDoc);
const crossType = buildFromEvents(
  [
    { m: '10', c: 'spoof-other', ct: 'clip', r: 0.8, t: now },
    mk(1, 1),
  ],
  { category: 'pop', contentsByKey, nowMs: now }
);
assert(
  crossType.experienceCount === 2,
  'category-wide affinity: clip + music both count — ' + crossType.experienceCount
);
assert(crossType.appliedEvents === 2, 'both contentTypes applied into affinity');
assert(
  Object.keys(crossType.affinityMap || {}).length > 0,
  'cross-type events produce affinityMap cells'
);

// Forged c cannot place content into wrong category
const forgedMusic = buildFromEvents(
  [{ m: 1, c: 'rock', ct: 'music', r: 0.9, t: now }],
  { category: 'rock', contentsByKey, nowMs: now }
);
assert(
  forgedMusic.experienceCount === 0,
  'forged c ignored; catalog categoryNameMusic only'
);

assert(
  !buildFromEvents(new Array(guestHistoryConfig.MAX_ENTRIES + 1).fill(mk(1, 0))).ok,
  'rejects over MAX_ENTRIES'
);
assert(
  !buildFromEvents([{ m: 1, c: 'pop', ct: 'nope', r: 0.5, t: now }]).ok,
  'rejects invalid contentType'
);

console.log('\n=== 2) Login music surface unchanged ===');
const ctrl = require('../recommendation-music/controllers');
assert(typeof ctrl.getByCategory === 'function', 'login getByCategory exists');
assert(typeof ctrl.postProgress === 'function', 'login postProgress exists');
assert(typeof ctrl.postGuestByCategory === 'function', 'guest endpoint exists');
assert(
  typeof require('../recommendation-music/services/serve.service')
    .getRecommendationsByCategory === 'function',
  'login serve unchanged'
);
assert(
  typeof require('../recommendation-music/services/affinity.service')
    .applyListenToAffinities === 'function',
  'login applyListenToAffinities intact'
);

console.log('\n=== 3) FE clear wiring (register / logout) ===');
const root = path.join(__dirname, '../../my-movie/src');
const authModal = fs.readFileSync(
  path.join(root, 'components/AuthModal/AuthModal.jsx'),
  'utf8'
);
const authCtx = fs.readFileSync(path.join(root, 'context/AuthContext.jsx'), 'utf8');
const api = fs.readFileSync(path.join(root, 'api/musicRecommendationsApi.js'), 'utf8');
const hook = fs.readFileSync(
  path.join(root, 'hooks/useHomeMusicCategoryRecommendations.js'),
  'utf8'
);
const musicStore = fs.readFileSync(
  path.join(root, 'utils/localStorage/guestHistory/musicGuestHistory.js'),
  'utf8'
);

assert(
  musicStore.includes('violet_guest_music_v1'),
  'music guest storage key violet_guest_music_v1'
);
assert(
  authModal.includes('clearGuestMusicListenHistory()'),
  'register clears music guest history'
);
assert(
  authCtx.includes('clearGuestMusicListenHistory()'),
  'logout clears music guest history (no restore)'
);
assert(api.includes('/guest'), 'FE guest POST path');
assert(api.includes('fetchMusicCategoryRecommendations'), 'FE login GET kept');
assert(
  hook.includes('fetchViewerMusicCategoryRecommendations'),
  'Home music hook uses viewer fetch'
);
assert(
  hook.includes('GUEST_MUSIC_HISTORY_CHANGED') && hook.includes('guestHistoryEpoch'),
  'Home music re-fetches on guest listen history change'
);
assert(
  /useState\(\s*true\s*\)/.test(hook) && hook.includes('isLoading'),
  'Home music isLoading starts true (no catalog flash)'
);

const reporter = fs.readFileSync(
  path.join(root, 'utils/musicListenProgressReporter.js'),
  'utf8'
);
assert(
  reporter.includes('albumDurationSec') && reporter.includes('completionDur'),
  'album guest completionRate uses albumDurationSec'
);

console.log('\nALL MUSIC GUEST VERIFICATION PASSED');
