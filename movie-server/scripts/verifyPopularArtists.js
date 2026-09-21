'use strict';

/**
 * Mashhur artistlar: alohida mahsulot, formula / credit nusxalanmagan.
 * Run: node scripts/verifyPopularArtists.js
 */

const fs = require('fs');
const path = require('path');

const assert = (cond, msg) => {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('ok   ', msg);
};

const {
  popularArtistsConfig,
} = require('../recommendation-artists/config/popularArtists.config');
const {
  scoringWeights,
} = require('../recommendation-artists/config/scoringWeights');

console.log('\n=== 1) Config ===');
assert(popularArtistsConfig.windowDays === 30, 'mashhur oyna 30 kun');
assert(popularArtistsConfig.topLimit === 20, 'mashhur topLimit=20');
assert(popularArtistsConfig.topMaxLimit === 20, 'mashhur topMaxLimit=20');
assert(scoringWeights.weeklyWindowDays === 7, 'hafta oynasi o‘zgarmagan');
assert(scoringWeights.topLimit === 10, 'weekly/top limit 10 saqlangan');
assert(scoringWeights.trendingWindowDays === 30, 'trending oyna saqlangan');
assert(
  !Object.prototype.hasOwnProperty.call(scoringWeights, 'popularWindowDays'),
  'popular knobs scoringWeights ga qo‘shilmagan'
);

console.log('\n=== 2) Thin service — formula nusxasi yo‘q, bitta clamp ===');
const servicePath = path.join(
  __dirname,
  '../recommendation-artists/services/popularArtistsRead.service.js'
);
const serviceSrc = fs.readFileSync(servicePath, 'utf8');
assert(serviceSrc.includes('getTopArtists'), 'pipeline getTopArtists orqali');
assert(
  serviceSrc.includes('popularArtistsConfig.windowDays'),
  'oyna configdan (query emas)'
);
assert(
  serviceSrc.includes('defaultLimit: popularArtistsConfig.topLimit'),
  'defaultLimit popular configdan'
);
assert(
  serviceSrc.includes('maxLimit: popularArtistsConfig.topMaxLimit'),
  'maxLimit popular configdan (scoringWeights ga bog‘lanmagan)'
);
assert(
  serviceSrc.includes('limit: result.limit'),
  'response limit haqiqiy clamp qiymati'
);
assert(
  !serviceSrc.includes('resolveTopLimit'),
  'popular o‘zi ikkinchi clamp qilmaydi — getTopArtists bir marta'
);
assert(
  serviceSrc.includes("source: result.artists?.length ? 'popular_artists' : 'empty'"),
  'source popular_artists'
);
assert(!serviceSrc.includes('CreditModel'), 'mashhur faylida o‘z credit o‘qishi yo‘q');
assert(!serviceSrc.includes('.aggregate('), 'mashhur faylida o‘z aggregate yo‘q');
assert(!serviceSrc.includes('applyCredits'), 'mashhur faylida credit yozuvi yo‘q');
assert(!serviceSrc.includes('withRanks'), 'rank topArtists ichida qoladi');
assert(
  !serviceSrc.includes("require('./artistWatchCount.service')"),
  'trending/credit to‘g‘ridan chaqirilmaydi'
);
assert(
  !serviceSrc.includes('scoringWeights'),
  'mashhur weekly knobs ga aralashmaydi'
);

console.log('\n=== 3) Shared top + weekly intact ===');
const topSrc = fs.readFileSync(
  path.join(
    __dirname,
    '../recommendation-artists/services/topArtists.service.js'
  ),
  'utf8'
);
assert(topSrc.includes('getTrendingArtists'), 'top → trending');
assert(topSrc.includes('withRanks'), 'rank top serviceda');
assert(topSrc.includes('getWeeklyTopArtists'), 'weekly wrapper saqlangan');
assert(
  topSrc.includes('scoringWeights.weeklyWindowDays'),
  'weekly oyna scoringWeights dan'
);
assert(
  topSrc.includes('opts.defaultLimit ?? scoringWeights.topLimit'),
  'top defaultLimit override qabul qiladi'
);
assert(
  topSrc.includes('opts.maxLimit ?? scoringWeights.topMaxLimit'),
  'top maxLimit override qabul qiladi'
);
assert(!topSrc.includes('popularArtistsConfig'), 'top service popular config bilmaydi');
assert(!topSrc.includes('popular_artists'), 'top service popular source yozmaydi');

const trendingSrc = fs.readFileSync(
  path.join(
    __dirname,
    '../recommendation-artists/services/artistWatchCount.service.js'
  ),
  'utf8'
);
assert(trendingSrc.includes('CreditModel.aggregate'), 'credit formula credit serviceda');
assert(
  trendingSrc.includes('scoringWeights.trendingWindowDays'),
  'trending default oyna saqlangan'
);

const services = require('../recommendation-artists/services');
assert(typeof services.getPopularArtists === 'function', 'services export getPopularArtists');
assert(typeof services.getTopArtists === 'function', 'getTopArtists saqlangan');
assert(typeof services.getWeeklyTopArtists === 'function', 'getWeeklyTopArtists saqlangan');
assert(typeof services.getTrendingArtists === 'function', 'getTrendingArtists saqlangan');

const { resolveTopLimit } = require('../recommendation-shared/topRanking');
const popularClamp = resolveTopLimit(undefined, {
  defaultLimit: popularArtistsConfig.topLimit,
  maxLimit: popularArtistsConfig.topMaxLimit,
});
const raisedClamp = resolveTopLimit(30, {
  defaultLimit: 30,
  maxLimit: 30,
});
const scoringClamp30 = resolveTopLimit(30, {
  defaultLimit: scoringWeights.topLimit,
  maxLimit: scoringWeights.topMaxLimit,
});
assert(popularClamp === 20, 'runtime: popular default clamp=20');
assert(raisedClamp === 30, 'runtime: popular max oshirilsa 30 saqlanadi');
assert(
  scoringClamp30 === scoringWeights.topMaxLimit,
  'runtime: scoringWeights max alohida (popular override siz qirqadi)'
);
assert(
  raisedClamp > scoringClamp30 || raisedClamp === scoringClamp30,
  'runtime: popular maxLimit override scoringWeights dan mustaqil'
);

console.log('\n=== 4) Controller + routes ===');
const ctrl = require('../recommendation-artists/controllers');
assert(typeof ctrl.listPopularArtists === 'function', 'popular handler');
assert(typeof ctrl.listWeeklyTopArtists === 'function', 'weekly-top saqlangan');
assert(typeof ctrl.listTopArtists === 'function', 'top saqlangan');
assert(typeof ctrl.listTrendingArtists === 'function', 'trending saqlangan');
assert(typeof ctrl.listRecommendedArtists === 'function', 'auth GET intact');
assert(typeof ctrl.postGuestRecommendedArtists === 'function', 'guest POST intact');
assert(typeof ctrl.getConfig === 'function', 'config intact');

const routes = require('../recommendation-artists/routes');
const listed = (routes.stack || [])
  .filter((layer) => layer.route)
  .map((layer) => `${Object.keys(layer.route.methods)[0]} ${layer.route.path}`);
assert(listed.includes('get /popular'), 'GET /popular registered');
assert(listed.includes('get /weekly-top'), 'GET /weekly-top saqlangan');
assert(listed.includes('get /top'), 'GET /top saqlangan');
assert(listed.includes('get /trending'), 'GET /trending saqlangan');
assert(
  listed.indexOf('get /popular') < listed.indexOf('get /'),
  'popular auth / dan oldin'
);
assert(
  listed.indexOf('get /weekly-top') < listed.indexOf('get /'),
  'weekly-top joyi saqlangan'
);

console.log('\n=== 5) FE wiring + recommended-style UI smoke ===');
const root = path.join(__dirname, '../../my-movie/src');
const api = fs.readFileSync(path.join(root, 'api/recommendedArtistsApi.js'), 'utf8');
const hook = fs.readFileSync(path.join(root, 'hooks/usePopularArtists.js'), 'utf8');
const ui = fs.readFileSync(
  path.join(root, 'Music/PopularArtists/PopularArtists.jsx'),
  'utf8'
);
const weeklyUi = fs.readFileSync(
  path.join(root, 'Music/WeeklyTopArtist/WeeklyTopArtist.jsx'),
  'utf8'
);
const topUi = fs.readFileSync(
  path.join(root, 'Music/TopArtist/TopArtist.jsx'),
  'utf8'
);
const recommendedUi = fs.readFileSync(
  path.join(root, 'Music/RecommendedArtists/RecommendedArtists.jsx'),
  'utf8'
);
const musicPage = fs.readFileSync(path.join(root, 'Music/Music.jsx'), 'utf8');

assert(api.includes('/recommended-artists/popular'), 'FE GET popular');
assert(api.includes('fetchPopularArtists'), 'fetchPopularArtists export');
assert(api.includes('fetchWeeklyTopArtists'), 'haftalik FE funksiya saqlangan');
assert(api.includes('fetchTopArtists'), 'top FE funksiya saqlangan');

assert(hook.includes('fetchPopularArtists'), 'hook fetchPopularArtists');
assert(/useState\(\s*true\s*\)/.test(hook), 'hook loading true');
assert(hook.includes('POPULAR_ARTISTS_LIMIT = 20') || hook.includes('= 20'), 'hook limit 20');

assert(ui.includes('usePopularArtists'), 'UI o‘z hookini chaqiradi');
assert(ui.includes('usePopularArtists(20)'), 'UI limit 20');
assert(ui.includes('Mashhur artistlar'), 'title Mashhur artistlar');
assert(ui.includes('RecommendedArtists.css'), 'UI tavsiya CSS (nusxa emas)');
assert(ui.includes('recommended-artists-item'), 'smoke: tavsiya kartochka class');
assert(ui.includes('FollowingButton'), 'smoke: Following tugmasi');
assert(ui.includes('recommended-artists-follow'), 'smoke: follow wrapper class');
assert(
  ui.includes("navigate(`/music/artist/${artist.id}`)"),
  'smoke: artist detail navigate'
);
assert(ui.includes('HorizontalScroll'), 'smoke: horizontal scroll');
assert(!ui.includes("from '../TopArtistsCarousel/TopArtistsCarousel'"), 'UI TopArtistsCarousel emas');
assert(!ui.includes('topRankSrc'), 'smoke: rank PNG yo‘q (tavsiya uslubi)');
assert(!ui.includes('useWeeklyTopArtists'), 'UI hafta hookiga chiqmagan');

assert(recommendedUi.includes('FollowingButton'), 'tavsiya Following saqlangan');
assert(recommendedUi.includes('recommended-artists-follow'), 'tavsiya follow class');

assert(weeklyUi.includes('useWeeklyTopArtists'), 'hafta thin wrapper saqlangan');
assert(weeklyUi.includes('TopArtistsCarousel'), 'hafta TopArtistsCarousel saqlangan');
assert(topUi.includes('useTopArtists'), 'top thin wrapper saqlangan');
assert(topUi.includes('TopArtistsCarousel'), 'top TopArtistsCarousel saqlangan');

assert(
  musicPage.includes('PopularArtists') &&
    musicPage.includes("clipSection.id === 'trend-clips'"),
  'Music: Mashhur artistlar trend-clips dan keyin'
);
assert(
  musicPage.indexOf('<PopularArtists />') <
    musicPage.indexOf('<WeeklyTopMusic />'),
  'Music: PopularArtists WeeklyTopMusic dan oldin (trend-clips blokida)'
);
assert(musicPage.includes('WeeklyTopArtist'), 'Music: WeeklyTopArtist saqlangan');
assert(musicPage.includes('TopArtist'), 'Music: TopArtist saqlangan');
assert(musicPage.includes('RecommendedArtists'), 'Music: RecommendedArtists saqlangan');

console.log('\nALL POPULAR ARTISTS VERIFICATION PASSED');
