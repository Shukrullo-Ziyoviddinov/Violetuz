'use strict';

/**
 * Mashhur albomlar: alohida mahsulot, formula nusxalanmagan.
 * Run: node scripts/verifyPopularAlbums.js
 */

const fs = require('fs');
const path = require('path');

const assert = (cond, msg) => {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('ok   ', msg);
};

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
assert(popularAlbumsConfig.windowDays === 30, 'albom oyna 30 kun');
assert(popularAlbumsConfig.topLimit === 20, 'albom topLimit=20');
assert(popularAlbumsConfig.topMaxLimit === 20, 'albom topMaxLimit=20');
assert(popularAlbumsConfig.minViews === 1, 'albom minViews=1');
assert(popularAlbumsConfig.contentType === 'album', 'albom contentType=album');
assert(weeklyTopMusicConfig.weeklyWindowDays === 7, 'hafta oynasi o‘zgarmagan');
assert(weeklyTopMusicConfig.contentType === 'music', 'hafta tip music saqlangan');
assert(monthlyTopMusicConfig.contentType === 'music', 'oy tip music saqlangan');
assert(monthlyTopMusicConfig.topLimit === 10, 'oy limit 10 saqlangan');

console.log('\n=== 2) Thin service — formula nusxasi yo‘q ===');
const servicePath = path.join(
  __dirname,
  '../recommendation-music/services/popularAlbumsRead.service.js'
);
const serviceSrc = fs.readFileSync(servicePath, 'utf8');
assert(
  serviceSrc.includes('readWeeklyMusicListenStats'),
  'pipeline weekly o‘qishdan'
);
assert(serviceSrc.includes('rankMusicListenStats'), 'tartib music adapterdan');
assert(
  serviceSrc.includes('popularAlbumsConfig.windowDays'),
  'oyna configdan (query emas)'
);
assert(
  serviceSrc.includes('popularAlbumsConfig.contentType'),
  'tip configdan (album)'
);
assert(
  serviceSrc.includes("source: items.length ? 'popular_albums' : 'empty'"),
  'source popular_albums'
);
assert(
  serviceSrc.includes('keepStatsWithLiveAlbums') ||
    serviceSrc.includes('Album.find'),
  'katalogda bor albomlar filtrlanadi (o‘lik id yo‘q)'
);
assert(
  serviceSrc.includes("require('../../models/Album.model')"),
  'Album katalogdan tekshiradi'
);
assert(!serviceSrc.includes('sameTieGroup'), 'albom faylida formula nusxasi yo‘q');
assert(!serviceSrc.includes('.sort('), 'albom faylida o‘z sorti yo‘q');
assert(!serviceSrc.includes('ListenEvent.aggregate'), 'albom faylida o‘z aggregate yo‘q');
assert(!serviceSrc.includes('MS_PER_DAY'), 'albom faylida o‘z oyna hisobi yo‘q');
assert(
  !serviceSrc.includes('rankByViewsThenSeconds'),
  'albom to‘g‘ridan umumiy rankerga chiqmagan'
);

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
    { contentKey: 'album:a', contentId: '1', viewCount: 3, listenedSeconds: 10 },
    { contentKey: 'album:b', contentId: '2', viewCount: 8, listenedSeconds: 5 },
  ],
  { limit: 20, maxLimit: 20, minViews: 1 }
);
assert(ranked[0].contentKey === 'album:b', 'runtime: ko‘proq view yuqorida');
assert(ranked.length === 2, 'runtime: ikkala albom kirdi');

console.log('\n=== 4) Controller + routes ===');
const ctrl = require('../recommendation-music/controllers');
assert(typeof ctrl.getPopularAlbums === 'function', 'popular-albums handler');
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
assert(listed.includes('get /popular-albums'), 'GET /popular-albums registered');
assert(
  listed.indexOf('get /popular-albums') <
    listed.indexOf('get /:categoryNameMusic'),
  'popular-albums category paramdan oldin'
);
assert(listed.includes('get /weekly-top'), 'GET /weekly-top saqlangan');
assert(listed.includes('get /monthly-top'), 'GET /monthly-top saqlangan');
assert(listed.includes('get /top-charts'), 'GET /top-charts saqlangan');

console.log('\n=== 5) FE wiring + smoke (album MusicCards) ===');
const root = path.join(__dirname, '../../my-movie/src');
const api = fs.readFileSync(path.join(root, 'api/musicRecommendationsApi.js'), 'utf8');
const hook = fs.readFileSync(path.join(root, 'hooks/usePopularAlbums.js'), 'utf8');
const ui = fs.readFileSync(
  path.join(root, 'Music/PopularAlbums/PopularAlbums.jsx'),
  'utf8'
);
const cards = fs.readFileSync(
  path.join(root, 'Music/MusicCards/MusicCards.jsx'),
  'utf8'
);
const musicPage = fs.readFileSync(path.join(root, 'Music/Music.jsx'), 'utf8');

assert(api.includes('/music-recommendations/popular-albums'), 'FE GET popular-albums');
assert(api.includes('fetchPopularAlbums'), 'fetchPopularAlbums export');
assert(
  hook.includes('fetchPopularAlbums') && /useState\(\s*true\s*\)/.test(hook),
  'hook fetch + loading true'
);
assert(ui.includes('usePopularAlbums'), 'UI o‘z hookini chaqiradi');
assert(ui.includes('MusicCards'), 'UI MusicCards');
assert(ui.includes("wishlistType: 'album'"), 'smoke: wishlist album');
assert(ui.includes("detailPathType: 'album'"), 'smoke: detail album path');
assert(ui.includes('Mashhur Albomlar'), 'title Mashhur Albomlar');
assert(ui.includes('initialCount: 10'), 'home limit 10');
assert(ui.includes("/music/more/popular-albums"), 'home moreTo MusicMorePage');
assert(!ui.includes('weeklyRankSrc'), 'smoke: rank PNG yo‘q');
assert(!ui.includes('TopMusicChart'), 'smoke: TopMusicChart emas');
assert(!ui.includes('oytop'), 'smoke: oytop yo‘q');

assert(cards.includes("`/music/album/${itemId}`"), 'MusicCards album detail');
assert(cards.includes('toggleWishlist(itemId, wishlistType)'), 'MusicCards wishlist');
assert(cards.includes('CartochkaHoverModal'), 'MusicCards play/hover (albumdek)');
assert(cards.includes('MusicButtonMore'), 'MusicCards more tugmasi');
assert(cards.includes('rankSrc={item.weeklyRankSrc || \'\'}'), 'rank faqat weeklyRankSrc bo‘lsa');

const morePage = fs.readFileSync(
  path.join(root, 'pageMusic/MusicMorePage.jsx'),
  'utf8'
);
assert(morePage.includes("'popular-albums'"), 'MusicMorePage section popular-albums');
assert(morePage.includes('isPopularAlbums'), 'MusicMorePage popular ranked list');
assert(morePage.includes('fetchPopularAlbums'), 'MusicMorePage API fetch');
assert(morePage.includes('Mashhur Albomlar'), 'MusicMorePage title');

assert(
  musicPage.includes('PopularAlbums') &&
    musicPage.includes("clipSection.id === 'visual-beats'"),
  'Music: Visual Beats dan keyin'
);

console.log('\nALL POPULAR ALBUMS VERIFICATION PASSED');
