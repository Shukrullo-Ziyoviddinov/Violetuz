'use strict';

/**
 * Mashhur kliplar: alohida mahsulot, formula nusxalanmagan.
 * Run: node scripts/verifyPopularClips.js
 */

const fs = require('fs');
const path = require('path');

const assert = (cond, msg) => {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('ok   ', msg);
};

const {
  popularClipsConfig,
} = require('../recommendation-music/config/popularClips.config');
const {
  popularAlbumsConfig,
} = require('../recommendation-music/config/popularAlbums.config');
const {
  monthlyTopMusicConfig,
} = require('../recommendation-music/config/monthlyTopMusic.config');
const {
  weeklyTopMusicConfig,
} = require('../recommendation-music/config/weeklyTopMusic.config');

console.log('\n=== 1) Config ===');
assert(popularClipsConfig.windowDays === 30, 'klip oyna 30 kun');
assert(popularClipsConfig.topLimit === 20, 'klip topLimit=20');
assert(popularClipsConfig.topMaxLimit === 20, 'klip topMaxLimit=20');
assert(popularClipsConfig.minViews === 1, 'klip minViews=1');
assert(popularClipsConfig.contentType === 'clip', 'klip contentType=clip');
assert(popularAlbumsConfig.contentType === 'album', 'albom tip album saqlangan');
assert(popularAlbumsConfig.topLimit === 20, 'albom limit 20 saqlangan');
assert(weeklyTopMusicConfig.weeklyWindowDays === 7, 'hafta oynasi o‘zgarmagan');
assert(weeklyTopMusicConfig.contentType === 'music', 'hafta tip music saqlangan');
assert(monthlyTopMusicConfig.contentType === 'music', 'oy tip music saqlangan');
assert(monthlyTopMusicConfig.topLimit === 10, 'oy limit 10 saqlangan');

console.log('\n=== 2) Thin service — formula nusxasi yo‘q ===');
const servicePath = path.join(
  __dirname,
  '../recommendation-music/services/popularClipsRead.service.js'
);
const serviceSrc = fs.readFileSync(servicePath, 'utf8');
assert(
  serviceSrc.includes('readWeeklyMusicListenStats'),
  'pipeline weekly o‘qishdan'
);
assert(serviceSrc.includes('rankMusicListenStats'), 'tartib music adapterdan');
assert(
  serviceSrc.includes('popularClipsConfig.windowDays'),
  'oyna configdan (query emas)'
);
assert(
  serviceSrc.includes('popularClipsConfig.contentType'),
  'tip configdan (clip)'
);
assert(
  serviceSrc.includes("source: items.length ? 'popular_clips' : 'empty'"),
  'source popular_clips'
);
assert(
  serviceSrc.includes('keepStatsWithLiveClips') ||
    serviceSrc.includes('Clip.find'),
  'katalogda bor kliplar filtrlanadi (o‘lik id yo‘q)'
);
assert(serviceSrc.includes("require('../../models/Clip.model')"), 'Clip katalogdan tekshiradi');
assert(!serviceSrc.includes('sameTieGroup'), 'klip faylida formula nusxasi yo‘q');
assert(!serviceSrc.includes('.sort('), 'klip faylida o‘z sorti yo‘q');
assert(!serviceSrc.includes('ListenEvent.aggregate'), 'klip faylida o‘z aggregate yo‘q');
assert(!serviceSrc.includes('MS_PER_DAY'), 'klip faylida o‘z oyna hisobi yo‘q');
assert(
  !serviceSrc.includes('rankByViewsThenSeconds'),
  'klip to‘g‘ridan umumiy rankerga chiqmagan'
);
assert(!serviceSrc.includes('popularAlbumsConfig'), 'klip albom config bilmaydi');

console.log('\n=== 3) Shared ranker + music adapter ===');
const sharedSrc = fs.readFileSync(
  path.join(__dirname, '../recommendation-shared/viewsSecondsTopRanker.js'),
  'utf8'
);
assert(sharedSrc.includes('rankByViewsThenSeconds'), 'umumiy ranker bor');
assert(sharedSrc.includes('sameTieGroup'), 'formula umumiy faylda');

const adapterSrc = fs.readFileSync(
  path.join(__dirname, '../recommendation-music/utils/musicListenStatsRanker.js'),
  'utf8'
);
assert(adapterSrc.includes('rankMusicListenStats'), 'music adapter bor');
assert(adapterSrc.includes('rankByViewsThenSeconds'), 'adapter umumiy rankerdan');

const { rankMusicListenStats } = require('../recommendation-music/utils/musicListenStatsRanker');
const ranked = rankMusicListenStats(
  [
    { contentKey: 'clip:a', contentId: '1', viewCount: 3, listenedSeconds: 10 },
    { contentKey: 'clip:b', contentId: '2', viewCount: 8, listenedSeconds: 5 },
  ],
  { limit: 20, maxLimit: 20, minViews: 1 }
);
assert(ranked[0].contentKey === 'clip:b', 'runtime: ko‘proq view yuqorida');
assert(ranked.length === 2, 'runtime: ikkala klip kirdi');

const albumServiceSrc = fs.readFileSync(
  path.join(
    __dirname,
    '../recommendation-music/services/popularAlbumsRead.service.js'
  ),
  'utf8'
);
assert(
  albumServiceSrc.includes("source: items.length ? 'popular_albums' : 'empty'"),
  'albom thin service saqlangan'
);

console.log('\n=== 4) Controller + routes ===');
const ctrl = require('../recommendation-music/controllers');
assert(typeof ctrl.getPopularClips === 'function', 'popular-clips handler');
assert(typeof ctrl.getPopularAlbums === 'function', 'popular-albums saqlangan');
assert(typeof ctrl.getWeeklyTopMusic === 'function', 'weekly-top saqlangan');
assert(typeof ctrl.getMonthlyTopMusic === 'function', 'monthly-top saqlangan');
assert(typeof ctrl.getTopMusicCharts === 'function', 'top-charts saqlangan');
assert(typeof ctrl.postProgress === 'function', 'POST progress intact');
assert(typeof ctrl.getByCategory === 'function', 'login GET intact');
assert(typeof ctrl.postGuestByCategory === 'function', 'guest POST intact');

const routes = require('../recommendation-music/routes');
const listed = (routes.stack || [])
  .filter((layer) => layer.route)
  .map((layer) => `${Object.keys(layer.route.methods)[0]} ${layer.route.path}`);
assert(listed.includes('get /popular-clips'), 'GET /popular-clips registered');
assert(listed.includes('get /popular-albums'), 'GET /popular-albums saqlangan');
assert(
  listed.indexOf('get /popular-clips') <
    listed.indexOf('get /:categoryNameMusic'),
  'popular-clips category paramdan oldin'
);
assert(listed.includes('get /weekly-top'), 'GET /weekly-top saqlangan');
assert(listed.includes('get /monthly-top'), 'GET /monthly-top saqlangan');
assert(listed.includes('get /top-charts'), 'GET /top-charts saqlangan');

console.log('\n=== 5) FE wiring + smoke (clip ClipsCards) ===');
const root = path.join(__dirname, '../../my-movie/src');
const api = fs.readFileSync(path.join(root, 'api/musicRecommendationsApi.js'), 'utf8');
const hook = fs.readFileSync(path.join(root, 'hooks/usePopularClips.js'), 'utf8');
const ui = fs.readFileSync(
  path.join(root, 'Music/PopularClips/PopularClips.jsx'),
  'utf8'
);
const cards = fs.readFileSync(
  path.join(root, 'Music/ClipsCards/ClipsCards.jsx'),
  'utf8'
);
const musicPage = fs.readFileSync(path.join(root, 'Music/Music.jsx'), 'utf8');
const morePage = fs.readFileSync(
  path.join(root, 'pageMusic/MusicMorePage.jsx'),
  'utf8'
);

assert(api.includes('/music-recommendations/popular-clips'), 'FE GET popular-clips');
assert(api.includes('fetchPopularClips'), 'fetchPopularClips export');
assert(api.includes('fetchPopularAlbums'), 'albom FE funksiya saqlangan');
assert(
  hook.includes('fetchPopularClips') && /useState\(\s*true\s*\)/.test(hook),
  'hook fetch + loading true'
);
assert(ui.includes('usePopularClips'), 'UI o‘z hookini chaqiradi');
assert(ui.includes('ClipsCards'), 'UI ClipsCards');
assert(ui.includes("wishlistType: 'klip'"), 'smoke: wishlist klip');
assert(ui.includes('Mashhur kliplar'), 'title Mashhur kliplar');
assert(ui.includes('initialCount: 10'), 'home limit 10');
assert(ui.includes("/music/more/popular-clips"), 'home moreTo MusicMorePage');
assert(!ui.includes('TopMusicChart'), 'smoke: TopMusicChart emas');
assert(!ui.includes('MusicCards'), 'smoke: MusicCards emas');
assert(!ui.includes('weeklyRankSrc'), 'smoke: rank PNG yo‘q');
assert(!ui.includes('oytop'), 'smoke: oytop yo‘q');

assert(cards.includes("navigate(`/music/video/${itemId}`)"), 'ClipsCards video detail');
assert(cards.includes('toggleWishlist(itemId, wishlistType)'), 'ClipsCards wishlist');
assert(cards.includes('CartochkaHoverModal'), 'ClipsCards play/hover');
assert(cards.includes('moreTo'), 'ClipsCards more tugmasi');

assert(morePage.includes("'popular-clips'"), 'MusicMorePage section popular-clips');
assert(morePage.includes('isPopularClips'), 'MusicMorePage popular clips ranked');
assert(morePage.includes('fetchPopularClips'), 'MusicMorePage API fetch');
assert(morePage.includes('Mashhur kliplar'), 'MusicMorePage title');
assert(morePage.includes('isPopularAlbums'), 'MusicMorePage popular-albums saqlangan');

assert(
  musicPage.includes('PopularClips') &&
    musicPage.includes("section.id === 'music-library'"),
  'Music: Musiqa kutubxonasi dan keyin'
);
assert(
  musicPage.includes("{section.id === 'music-library' ? <PopularClips /> : null}"),
  'Music: PopularClips music-library mount'
);
assert(musicPage.includes('PopularAlbums'), 'Music: PopularAlbums saqlangan');

console.log('\nALL POPULAR CLIPS VERIFICATION PASSED');
