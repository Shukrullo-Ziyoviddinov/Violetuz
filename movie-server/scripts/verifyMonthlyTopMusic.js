'use strict';

/**
 * Oyning top musiqalari: alohida mahsulot, formula nusxalanmagan.
 * Run: node scripts/verifyMonthlyTopMusic.js
 */

const fs = require('fs');
const path = require('path');

const assert = (cond, msg) => {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('ok   ', msg);
};

const {
  monthlyTopMusicConfig,
} = require('../recommendation-music/config/monthlyTopMusic.config');
const {
  weeklyTopMusicConfig,
} = require('../recommendation-music/config/weeklyTopMusic.config');

console.log('\n=== 1) Config ===');
assert(monthlyTopMusicConfig.windowDays === 30, 'oy oyna 30 kun');
assert(monthlyTopMusicConfig.topLimit === 10, 'oy topLimit=10');
assert(monthlyTopMusicConfig.topMaxLimit === 10, 'oy topMaxLimit=10');
assert(monthlyTopMusicConfig.minViews === 1, 'oy minViews=1');
assert(monthlyTopMusicConfig.contentType === 'music', 'oy contentType=music');
assert(weeklyTopMusicConfig.weeklyWindowDays === 7, 'hafta oynasi o‘zgarmagan');
assert(weeklyTopMusicConfig.contentType === 'music', 'hafta contentType saqlangan');

console.log('\n=== 2) Thin service — formula nusxasi yo‘q ===');
const servicePath = path.join(
  __dirname,
  '../recommendation-music/services/monthlyTopMusicRead.service.js'
);
const serviceSrc = fs.readFileSync(servicePath, 'utf8');
assert(
  serviceSrc.includes('readWeeklyMusicListenStats'),
  'pipeline weekly o‘qishdan'
);
assert(serviceSrc.includes('rankMusicListenStats'), 'tartib music adapterdan');
assert(
  serviceSrc.includes('monthlyTopMusicConfig.windowDays'),
  'oyna configdan (query emas)'
);
assert(
  serviceSrc.includes("source: items.length ? 'monthly_top_music' : 'empty'"),
  'source monthly_top_music'
);
assert(!serviceSrc.includes('sameTieGroup'), 'oy faylida formula nusxasi yo‘q');
assert(!serviceSrc.includes('.sort('), 'oy faylida o‘z sorti yo‘q');
assert(!serviceSrc.includes('ListenEvent.aggregate'), 'oy faylida o‘z aggregate yo‘q');
assert(!serviceSrc.includes('MS_PER_DAY'), 'oy faylida o‘z oyna hisobi yo‘q');
assert(!serviceSrc.includes('rankByViewsThenSeconds'), 'oy to‘g‘ridan umumiy rankerga chiqmagan');

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
assert(!adapterSrc.includes('sameTieGroup'), 'adapterda formula nusxasi yo‘q');
assert(!adapterSrc.includes('windowDays'), 'adapter oyna bilmaydi');

const weeklyReadSrc = fs.readFileSync(
  path.join(
    __dirname,
    '../recommendation-music/services/weeklyTopMusicRead.service.js'
  ),
  'utf8'
);
assert(
  weeklyReadSrc.includes('readWeeklyMusicListenStats'),
  'weekly stats export saqlangan'
);
assert(
  weeklyReadSrc.includes('rankMusicListenStats'),
  'weekly ham music adapterdan'
);

console.log('\n=== 4) Controller + routes ===');
const ctrl = require('../recommendation-music/controllers');
assert(typeof ctrl.getMonthlyTopMusic === 'function', 'monthly-top music handler');
assert(typeof ctrl.getTopMusicCharts === 'function', 'top-charts music handler');
assert(typeof ctrl.getWeeklyTopMusic === 'function', 'weekly-top music saqlangan');
assert(typeof ctrl.postProgress === 'function', 'POST progress intact');
assert(typeof ctrl.getByCategory === 'function', 'login GET intact');
assert(typeof ctrl.postGuestByCategory === 'function', 'guest POST intact');

const routes = require('../recommendation-music/routes');
const listed = (routes.stack || [])
  .filter((layer) => layer.route)
  .map((layer) => `${Object.keys(layer.route.methods)[0]} ${layer.route.path}`);
assert(listed.includes('get /monthly-top'), 'GET /monthly-top registered');
assert(listed.includes('get /weekly-top'), 'GET /weekly-top saqlangan');
assert(listed.includes('get /top-charts'), 'GET /top-charts registered');
assert(
  listed.indexOf('get /top-charts') <
    listed.indexOf('get /:categoryNameMusic'),
  'top-charts category paramdan oldin'
);
assert(
  listed.indexOf('get /monthly-top') <
    listed.indexOf('get /:categoryNameMusic'),
  'monthly-top category paramdan oldin'
);
assert(
  listed.indexOf('get /weekly-top') <
    listed.indexOf('get /:categoryNameMusic'),
  'weekly-top joyi saqlangan'
);

console.log('\n=== 5) FE wiring + oytop PNG + shared smoke surface ===');
const root = path.join(__dirname, '../../my-movie/src');
const publicImg = path.join(__dirname, '../../my-movie/public/img');
const api = fs.readFileSync(path.join(root, 'api/musicRecommendationsApi.js'), 'utf8');
const hook = fs.readFileSync(path.join(root, 'hooks/useMonthlyTopMusic.js'), 'utf8');
const ui = fs.readFileSync(
  path.join(root, 'Music/MonthlyTopMusic/MonthlyTopMusic.jsx'),
  'utf8'
);
const weeklyUi = fs.readFileSync(
  path.join(root, 'Music/WeeklyTopMusic/WeeklyTopMusic.jsx'),
  'utf8'
);
const chartUi = fs.readFileSync(
  path.join(root, 'Music/TopMusicChart/TopMusicChart.jsx'),
  'utf8'
);
const rankUtil = fs.readFileSync(path.join(root, 'utils/topRankPreview.js'), 'utf8');
const musicPage = fs.readFileSync(path.join(root, 'Music/Music.jsx'), 'utf8');

assert(api.includes('/music-recommendations/monthly-top'), 'FE GET monthly-top');
assert(api.includes('fetchMonthlyTopMusic'), 'fetchMonthlyTopMusic export');
assert(api.includes('/music-recommendations/top-charts'), 'FE GET top-charts');
assert(api.includes('fetchMusicTopCharts'), 'fetchMusicTopCharts export');
assert(api.includes('fetchWeeklyTopMusic'), 'haftalik FE funksiya saqlangan');
assert(
  hook.includes('loadMusicTopChartsOnce') && /useState\(\s*true\s*\)/.test(hook),
  'oy hook shared top-charts'
);
const weeklyHook = fs.readFileSync(
  path.join(root, 'hooks/useWeeklyTopMusic.js'),
  'utf8'
);
assert(
  weeklyHook.includes('loadMusicTopChartsOnce'),
  'hafta hook ham shared top-charts'
);
const sharedHook = fs.readFileSync(
  path.join(root, 'hooks/musicTopChartsShared.js'),
  'utf8'
);
assert(sharedHook.includes('fetchMusicTopCharts'), 'shared loader bitta API');
assert(!fs.existsSync(path.join(root, 'Music/WeeklyTopMusic/WeeklyTopMusic.css')), 'orphan WeeklyTopMusic.css yo‘q');
assert(ui.includes('useMonthlyTopMusic'), 'oy komponent o‘z hookini chaqiradi');
assert(ui.includes('TopMusicChart'), 'oy shared TopMusicChart');
assert(ui.includes('monthlyTopRankSrc'), 'oy oytop rankSrc');
assert(!ui.includes('useWeeklyTopMusic'), 'oy komponent hafta hookiga chiqmagan');
assert(weeklyUi.includes('useWeeklyTopMusic'), 'hafta komponent o‘zgarmagan');
assert(weeklyUi.includes('TopMusicChart'), 'hafta ham shared chart');
assert(
  musicPage.includes('WeeklyTopMusic') &&
    musicPage.includes("clipSection.id === 'trend-clips'"),
  'Music: weekly trend-clips dan keyin'
);
assert(
  musicPage.includes('MonthlyTopMusic') &&
    musicPage.includes("concertSection.id === 'jaxon-concerts'"),
  'Music: monthly jaxon-concerts dan keyin'
);

assert(rankUtil.includes('oytop1_preview_rev_1.png'), 'monthlyTopRankSrc oytop1');
assert(rankUtil.includes('MONTHLY_TOP_RANK_SRC'), 'MONTHLY_TOP_RANK_SRC bor');
assert(rankUtil.includes('monthlyTopRankSrc'), 'monthlyTopRankSrc export');
for (let n = 1; n <= 10; n += 1) {
  const file = path.join(publicImg, `oytop${n}_preview_rev_1.png`);
  assert(fs.existsSync(file), `public oytop${n} mavjud`);
}

assert(chartUi.includes('loadAndPlayTrack'), 'smoke: play');
assert(chartUi.includes("navigate(`/music/${item.id}`)"), 'smoke: detail navigate');
assert(chartUi.includes('TopMusicMoreModal'), 'smoke: more modal');
assert(chartUi.includes('dominantColor'), 'smoke: active dominant color');
assert(chartUi.includes('top-music-chart-play'), 'smoke: play tugmasi');
assert(chartUi.includes('top-music-chart-more'), 'smoke: more tugmasi');

console.log('\nALL MONTHLY TOP MUSIC VERIFICATION PASSED');
