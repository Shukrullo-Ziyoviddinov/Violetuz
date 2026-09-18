'use strict';

/**
 * Oyning top filmlari: alohida mahsulot, formula nusxalanmagan.
 * Run: node scripts/verifyMonthlyTopMovies.js
 */

const fs = require('fs');
const path = require('path');

const assert = (cond, msg) => {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('ok   ', msg);
};

const { monthlyTopMoviesConfig } = require('../recommendation/config/monthlyTopMovies.config');
const { weeklyTopMoviesConfig } = require('../recommendation/config/weeklyTopMovies.config');

assert(monthlyTopMoviesConfig.windowDays === 30, 'oy oyna 30 kun');
assert(monthlyTopMoviesConfig.topLimit === 10, 'oy topLimit=10');
assert(monthlyTopMoviesConfig.minViews === 1, 'oy minViews=1');
assert(weeklyTopMoviesConfig.weeklyWindowDays === 7, 'hafta oynasi o‘zgarmagan');

const servicePath = path.join(
  __dirname,
  '../recommendation/services/monthlyTopMoviesRead.service.js'
);
const serviceSrc = fs.readFileSync(servicePath, 'utf8');
assert(serviceSrc.includes('rankWeeklyTopMovies'), 'tartib weekly rankerdan');
assert(serviceSrc.includes('readWeeklyMovieWatchStats'), 'pipeline weekly o‘qishdan');
assert(!serviceSrc.includes('sameTieGroup'), 'oy faylida formula nusxasi yo‘q');
assert(!serviceSrc.includes('.sort('), 'oy faylida o‘z sorti yo‘q');

const rankerSrc = fs.readFileSync(
  path.join(__dirname, '../recommendation/utils/weeklyTopMoviesRanker.js'),
  'utf8'
);
assert(rankerSrc.includes('opts.maxLimit'), 'ranker oylik capni qabul qiladi');
assert(rankerSrc.includes('rankByViewsThenSeconds'), 'kino adapter umumiy rankerdan');
assert(!rankerSrc.includes('sameTieGroup'), 'kino adapterda formula nusxasi yo‘q');
assert(!rankerSrc.includes('windowDays'), 'ranker oyna bilmaydi');

const sharedSrc = fs.readFileSync(
  path.join(__dirname, '../recommendation-shared/viewsSecondsTopRanker.js'),
  'utf8'
);
assert(sharedSrc.includes('rankByViewsThenSeconds'), 'umumiy ranker bor');
assert(sharedSrc.includes('sameTieGroup'), 'formula umumiy faylda');

const ctrl = require('../recommendation/controllers');
assert(typeof ctrl.getMonthlyTopMovies === 'function', 'monthly-top handler');
assert(typeof ctrl.getWeeklyTopMovies === 'function', 'weekly-top handler saqlangan');
assert(typeof ctrl.postProgress === 'function', 'progress handler saqlangan');

const routes = require('../recommendation/routes');
const listed = (routes.stack || [])
  .filter((layer) => layer.route)
  .map((layer) => `${Object.keys(layer.route.methods)[0]} ${layer.route.path}`);
assert(listed.includes('get /monthly-top'), 'GET /monthly-top registered');
assert(
  listed.indexOf('get /monthly-top') < listed.indexOf('get /:category'),
  'monthly-top category paramdan oldin'
);
assert(
  listed.indexOf('get /weekly-top') < listed.indexOf('get /:category'),
  'weekly-top joyi saqlangan'
);

const root = path.join(__dirname, '../../my-movie/src');
const api = fs.readFileSync(path.join(root, 'api/recommendationsApi.js'), 'utf8');
const hook = fs.readFileSync(path.join(root, 'hooks/useMonthlyTopMovies.js'), 'utf8');
const ui = fs.readFileSync(
  path.join(root, 'components/MonthlyTopMovies/MonthlyTopMovies.jsx'),
  'utf8'
);
const home = fs.readFileSync(path.join(root, 'pages/Home.jsx'), 'utf8');
const weeklyUi = fs.readFileSync(
  path.join(root, 'components/WeeklyTopMovies/WeeklyTopMovies.jsx'),
  'utf8'
);

assert(api.includes('/recommendations/monthly-top'), 'FE GET monthly-top');
assert(api.includes('fetchWeeklyTopMovies'), 'haftalik FE funksiya saqlangan');
assert(hook.includes('fetchMonthlyTopMovies') && /useState\(\s*true\s*\)/.test(hook), 'oy hook alohida');
assert(ui.includes('useMonthlyTopMovies'), 'oy komponent o‘z hookini chaqiradi');
assert(!ui.includes('useWeeklyTopMovies'), 'oy komponent hafta hookiga chiqmagan');
assert(weeklyUi.includes('useWeeklyTopMovies'), 'hafta komponent o‘zgarmagan');
assert(
  home.includes("sectionType === 'koreaDrama' ? <WeeklyTopMovies />"),
  'hafta Korea dramalaridan keyin qolgan'
);
assert(
  home.includes("sectionType === 'animations' ? <MonthlyTopMovies />"),
  'Home: Multfilmlardan keyin'
);

console.log('\nALL MONTHLY TOP MOVIES VERIFICATION PASSED');
