'use strict';

/**
 * Haftaning top filmlari ranker verify (Mongo shart emas).
 * Run: node scripts/verifyWeeklyTopMovies.js
 */

const fs = require('fs');
const path = require('path');

const assert = (cond, msg) => {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('ok   ', msg);
};

const { rankWeeklyTopMovies } = require('../recommendation/utils/weeklyTopMoviesRanker');
const { weeklyTopMoviesConfig } = require('../recommendation/config/weeklyTopMovies.config');

const row = (movieId, viewCount, watchedSeconds) => ({
  movieId,
  viewCount,
  watchedSeconds,
});

console.log('\n=== 1) Ko‘rish soni daqiqadan ustun ===');
const viewsWin = rankWeeklyTopMovies([
  row('a', 14, 34 * 60),
  row('b', 13, 43 * 60),
]);
assert(viewsWin[0].movieId === 'a', '14 ko‘rish 1-o‘rin (34 daqiqa)');
assert(viewsWin[1].movieId === 'b', '13 ko‘rish 2-o‘rin (43 daqiqa yuta olmaydi)');

console.log('\n=== 2) Teng ko‘rishda daqiqa tartibi ===');
const minuteOrder = rankWeeklyTopMovies([
  row('low', 1, 14 * 60),
  row('high', 1, 30 * 60),
  row('mid', 1, 20 * 60),
]);
assert(
  minuteOrder.map((item) => item.movieId).join(',') === 'high,mid,low',
  '1=1 → 30, 20, 14 daqiqa'
);

console.log('\n=== 3) To‘liq tenglikda kutish ===');
const identical = [];
for (let i = 1; i <= 100; i += 1) {
  identical.push(row(String(i), 1, 10 * 60));
}
assert(rankWeeklyTopMovies(identical).length === 0, '100 ta bir xil ko‘rish+daqiqa → hech biri kirmaydi');

const twoResolved = [
  row('hi', 1, 30 * 60),
  row('mid', 1, 15 * 60),
  ...Array.from({ length: 98 }, (_, i) => row(`t${i}`, 1, 10 * 60)),
];
const partial = rankWeeklyTopMovies(twoResolved);
assert(partial.length === 2, 'ajralgan 2 ta kiradi, qolgan teng 98 kutiladi');
assert(partial[0].movieId === 'hi' && partial[1].movieId === 'mid', 'ajralganlar daqiqa tartibida');

const overflow = rankWeeklyTopMovies([
  ...Array.from({ length: 8 }, (_, i) => row(`top${i}`, 5, 1000)),
  ...Array.from({ length: 3 }, (_, i) => row(`tie${i}`, 2, 500)),
]);
assert(overflow.length === 8, 'qolgan joyga sig‘magan teng guruh tushib qoladi');

assert(weeklyTopMoviesConfig.topLimit === 10, 'config topLimit=10');
assert(weeklyTopMoviesConfig.weeklyWindowDays === 7, 'config window=7');
assert(weeklyTopMoviesConfig.minViews === 1, 'config minViews=1');

const adapterSrc = fs.readFileSync(
  path.join(__dirname, '../recommendation/utils/weeklyTopMoviesRanker.js'),
  'utf8'
);
assert(adapterSrc.includes('rankByViewsThenSeconds'), 'hafta adapter umumiy rankerdan');
assert(!adapterSrc.includes('sameTieGroup'), 'hafta adapterda formula nusxasi yo‘q');
assert(
  fs.existsSync(
    path.join(__dirname, '../recommendation-shared/viewsSecondsTopRanker.js')
  ),
  'umumiy viewsSecondsTopRanker bor'
);

console.log('\n=== 4) Progress export buzilmagan ===');
const progress = require('../recommendation/services/progress.service');
assert(typeof progress.reportMovieProgress === 'function', 'reportMovieProgress intact');
assert(typeof progress.isEligibleProgress === 'function', 'isEligibleProgress intact');

const ctrl = require('../recommendation/controllers');
assert(typeof ctrl.postProgress === 'function', 'POST progress handler intact');
assert(typeof ctrl.getByCategory === 'function', 'login GET handler intact');
assert(typeof ctrl.postGuestByCategory === 'function', 'guest POST handler intact');
assert(typeof ctrl.getWeeklyTopMovies === 'function', 'weekly-top handler exists');

const routes = require('../recommendation/routes');
const listed = (routes.stack || [])
  .filter((layer) => layer.route)
  .map((layer) => `${Object.keys(layer.route.methods)[0]} ${layer.route.path}`);
assert(listed.includes('get /weekly-top'), 'GET /weekly-top registered');
assert(
  listed.indexOf('get /weekly-top') < listed.indexOf('get /:category'),
  'weekly-top category paramdan oldin'
);

console.log('\n=== 5) FE wiring ===');
const root = path.join(__dirname, '../../my-movie/src');
const api = fs.readFileSync(path.join(root, 'api/recommendationsApi.js'), 'utf8');
const hook = fs.readFileSync(path.join(root, 'hooks/useWeeklyTopMovies.js'), 'utf8');
const ui = fs.readFileSync(
  path.join(root, 'components/WeeklyTopMovies/WeeklyTopMovies.jsx'),
  'utf8'
);
const home = fs.readFileSync(path.join(root, 'pages/Home.jsx'), 'utf8');

assert(api.includes('/recommendations/weekly-top'), 'FE GET weekly-top');
assert(api.includes('fetchViewerCategoryRecommendations'), 'login/guest viewer path kept');
assert(hook.includes('fetchWeeklyTopMovies') && /useState\(\s*true\s*\)/.test(hook), 'hook fetch + loading true');
assert(ui.includes('displayMovies.length === 0) return null'), 'empty block hidden');
assert(
  home.includes("sectionType === 'koreaDrama' ? <WeeklyTopMovies />"),
  'Home: Korea dramalaridan keyin'
);

console.log('\nALL WEEKLY TOP MOVIES VERIFICATION PASSED');
