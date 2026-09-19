'use strict';

/**
 * Haftaning top musiqalari verify (Mongo shart emas).
 * Run: node scripts/verifyWeeklyTopMusic.js
 */

const fs = require('fs');
const path = require('path');

const assert = (cond, msg) => {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('ok   ', msg);
};

const {
  rankByViewsThenSeconds,
} = require('../recommendation-shared/viewsSecondsTopRanker');
const { weeklyTopMusicConfig } = require('../recommendation-music/config/weeklyTopMusic.config');
const {
  buildWeeklyMusicListenPipeline,
} = require('../recommendation-music/services/weeklyTopMusicRead.service');

const row = (itemId, viewCount, seconds) => ({
  itemId,
  viewCount,
  seconds,
});

console.log('\n=== 1) Umumiy formula (musiqa itemId) ===');
const viewsWin = rankByViewsThenSeconds([
  row('music:a', 14, 34 * 60),
  row('music:b', 13, 43 * 60),
]);
assert(viewsWin[0].itemId === 'music:a', '14 tinglovchi 1-o‘rin');
assert(viewsWin[1].itemId === 'music:b', '13 tinglovchi 2-o‘rin (sekund yuta olmaydi)');

const secondOrder = rankByViewsThenSeconds([
  row('music:low', 1, 14 * 60),
  row('music:high', 1, 30 * 60),
  row('music:mid', 1, 20 * 60),
]);
assert(
  secondOrder.map((item) => item.itemId).join(',') ===
    'music:high,music:mid,music:low',
  '1=1 → sekund tartibi'
);

const identical = [];
for (let i = 1; i <= 100; i += 1) {
  identical.push(row(`music:${i}`, 1, 10 * 60));
}
assert(
  rankByViewsThenSeconds(identical).length === 0,
  '100 ta bir xil → hech biri kirmaydi'
);

console.log('\n=== 2) Config ===');
assert(weeklyTopMusicConfig.topLimit === 10, 'topLimit=10');
assert(weeklyTopMusicConfig.weeklyWindowDays === 7, 'window=7');
assert(weeklyTopMusicConfig.minViews === 1, 'minViews=1');
assert(weeklyTopMusicConfig.contentType === 'music', 'contentType=music');

console.log('\n=== 3) ListenEvent o‘qish — formula nusxasi yo‘q ===');
const readSrc = fs.readFileSync(
  path.join(
    __dirname,
    '../recommendation-music/services/weeklyTopMusicRead.service.js'
  ),
  'utf8'
);
assert(readSrc.includes('ListenEvent'), 'ListenEvent o‘qiydi');
assert(readSrc.includes('rankMusicListenStats'), 'music adapter rankerdan');
assert(!readSrc.includes('sameTieGroup'), 'formula nusxasi yo‘q');
assert(!readSrc.includes('.sort('), 'o‘z sorti yo‘q');
assert(
  readSrc.includes('contentType: weeklyTopMusicConfig.contentType'),
  'tip configdan (music)'
);

const pipe = buildWeeklyMusicListenPipeline(
  new Date(0),
  new Date(),
  weeklyTopMusicConfig.contentType
);
assert(pipe[0].$match.contentType === 'music', 'pipeline faqat music');
assert(!!pipe[0].$match.listenedAt, 'listenedAt oynasi');
assert(
  pipe[1].$group.listenedSeconds.$max === '$listenedSeconds',
  'user×key $max listenedSeconds'
);

console.log('\n=== 4) Progress / guest / artist intact ===');
const progress = require('../recommendation-music/services/progress.service');
assert(typeof progress.reportMusicProgress === 'function', 'reportMusicProgress intact');

const ctrl = require('../recommendation-music/controllers');
assert(typeof ctrl.getWeeklyTopMusic === 'function', 'weekly-top music handler');
assert(typeof ctrl.postProgress === 'function', 'POST progress intact');
assert(typeof ctrl.getByCategory === 'function', 'login GET intact');
assert(typeof ctrl.postGuestByCategory === 'function', 'guest POST intact');
assert(typeof ctrl.getProgressConfig === 'function', 'config/progress intact');

const artistCtrl = require('../recommendation-artists/controllers');
assert(
  typeof artistCtrl.listWeeklyTopArtists === 'function',
  'artist weekly-top intact'
);

const routes = require('../recommendation-music/routes');
const listed = (routes.stack || [])
  .filter((layer) => layer.route)
  .map((layer) => `${Object.keys(layer.route.methods)[0]} ${layer.route.path}`);
assert(listed.includes('get /weekly-top'), 'GET /weekly-top registered');
assert(
  listed.indexOf('get /weekly-top') <
    listed.indexOf('get /:categoryNameMusic'),
  'weekly-top category paramdan oldin'
);
assert(listed.includes('post /progress'), 'POST progress saqlangan');
assert(listed.includes('post /:categoryNameMusic/guest'), 'guest POST saqlangan');

const artistRoutes = require('../recommendation-artists/routes');
const artistListed = (artistRoutes.stack || [])
  .filter((layer) => layer.route)
  .map((layer) => `${Object.keys(layer.route.methods)[0]} ${layer.route.path}`);
assert(
  artistListed.includes('get /weekly-top'),
  'artist GET /weekly-top saqlangan'
);

console.log('\n=== 5) FE wiring ===');
const root = path.join(__dirname, '../../my-movie/src');
const api = fs.readFileSync(path.join(root, 'api/musicRecommendationsApi.js'), 'utf8');
const artistsApi = fs.readFileSync(
  path.join(root, 'api/recommendedArtistsApi.js'),
  'utf8'
);
const hook = fs.readFileSync(path.join(root, 'hooks/useWeeklyTopMusic.js'), 'utf8');
const ui = fs.readFileSync(
  path.join(root, 'Music/WeeklyTopMusic/WeeklyTopMusic.jsx'),
  'utf8'
);
const chartUi = fs.readFileSync(
  path.join(root, 'Music/TopMusicChart/TopMusicChart.jsx'),
  'utf8'
);
const artistUi = fs.readFileSync(
  path.join(root, 'Music/WeeklyTopArtist/WeeklyTopArtist.jsx'),
  'utf8'
);
const musicPage = fs.readFileSync(path.join(root, 'Music/Music.jsx'), 'utf8');

assert(
  hook.includes('loadMusicTopChartsOnce') && /useState\(\s*true\s*\)/.test(hook),
  'hook shared top-charts + loading true'
);
assert(api.includes('fetchMusicTopCharts') || api.includes('/music-recommendations/top-charts'), 'FE top-charts');
assert(api.includes('/music-recommendations/weekly-top'), 'FE GET weekly-top music');
assert(api.includes('fetchWeeklyTopMusic'), 'fetchWeeklyTopMusic export');
assert(api.includes('fetchViewerMusicCategoryRecommendations') || api.includes('fetchMusicCategoryRecommendations'), 'login/guest music path kept');
assert(artistsApi.includes('fetchWeeklyTopArtists'), 'artist weekly FE intact');
assert(ui.includes('useWeeklyTopMusic'), 'UI o‘z hookini chaqiradi');
assert(ui.includes('TopMusicChart'), 'UI shared TopMusicChart');
assert(!ui.includes('useWeeklyTopArtists'), 'UI artist hookiga chiqmagan');
assert(chartUi.includes('top-music-chart-card'), 'horizontal card UI (shared)');
assert(chartUi.includes('top-music-chart-play'), 'play/pause tugmasi (shared)');
assert(chartUi.includes('music-detail-artist-duration'), 'duration music-detail uslubida');
assert(!chartUi.includes('MusicCards'), 'poster MusicCards emas');
assert(artistUi.includes('useWeeklyTopArtists'), 'artist UI o‘zgarmagan');
assert(
  musicPage.includes('WeeklyTopMusic') &&
    musicPage.includes("clipSection.id === 'trend-clips'"),
  'Music: Trend kliplardan keyin weekly'
);
assert(
  musicPage.includes('MonthlyTopMusic') &&
    musicPage.includes("concertSection.id === 'jaxon-concerts'"),
  'Music: Jaxon konsertlaridan keyin monthly'
);
assert(musicPage.includes('music-drops'), 'Music drops joyi saqlangan');

console.log('\nALL WEEKLY TOP MUSIC VERIFICATION PASSED');
