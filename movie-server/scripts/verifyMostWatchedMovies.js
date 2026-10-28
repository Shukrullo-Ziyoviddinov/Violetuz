'use strict';

/**
 * Hozir trendda: alohida mahsulot, hafta/oy top 10 ga yozilmaydi.
 * Run: node scripts/verifyMostWatchedMovies.js
 */

const fs = require('fs');
const path = require('path');

const assert = (cond, msg) => {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('ok   ', msg);
};

const { mostWatchedMoviesConfig } = require('../recommendation/config/mostWatchedMovies.config');
const { weeklyTopMoviesConfig } = require('../recommendation/config/weeklyTopMovies.config');
const { monthlyTopMoviesConfig } = require('../recommendation/config/monthlyTopMovies.config');

assert(mostWatchedMoviesConfig.topLimit === 20, 'trend topLimit=20');
assert(mostWatchedMoviesConfig.topMaxLimit === 20, 'trend topMaxLimit=20');
assert(mostWatchedMoviesConfig.windowDays === 7, 'trend oyna 7 kun');
assert(mostWatchedMoviesConfig.minViews === 1, 'trend minViews=1');
assert(weeklyTopMoviesConfig.topLimit === 10, 'hafta topLimit o‘zgarmagan');
assert(weeklyTopMoviesConfig.weeklyWindowDays === 7, 'hafta oynasi o‘zgarmagan');
assert(monthlyTopMoviesConfig.topLimit === 10, 'oy topLimit o‘zgarmagan');
assert(monthlyTopMoviesConfig.windowDays === 30, 'oy oynasi o‘zgarmagan');

const serviceSrc = fs.readFileSync(
  path.join(__dirname, '../recommendation/services/mostWatchedMoviesRead.service.js'),
  'utf8'
);
assert(serviceSrc.includes('readWeeklyMovieWatchStats'), 'pipeline weekly o‘qishdan');
assert(serviceSrc.includes('rankWeeklyTopMovies'), 'tartib weekly rankerdan');
assert(serviceSrc.includes('mostWatchedMoviesConfig'), 'o‘z configi');
assert(!serviceSrc.includes('weeklyTopMoviesConfig'), 'hafta configiga yozilmaydi');
assert(!serviceSrc.includes('monthlyTopMoviesConfig'), 'oy configiga yozilmaydi');
assert(!serviceSrc.includes('.sort('), 'trend faylida o‘z sorti yo‘q');

const ctrl = require('../recommendation/controllers');
assert(typeof ctrl.getMostWatchedMovies === 'function', 'most-watched handler');
assert(typeof ctrl.getWeeklyTopMovies === 'function', 'weekly-top saqlangan');
assert(typeof ctrl.getMonthlyTopMovies === 'function', 'monthly-top saqlangan');

const routes = require('../recommendation/routes');
const listed = (routes.stack || [])
  .filter((layer) => layer.route)
  .map((layer) => `${Object.keys(layer.route.methods)[0]} ${layer.route.path}`);
assert(listed.includes('get /most-watched'), 'GET /most-watched registered');
assert(
  listed.indexOf('get /most-watched') < listed.indexOf('get /:category'),
  'most-watched category paramdan oldin'
);
assert(
  listed.indexOf('get /weekly-top') < listed.indexOf('get /:category'),
  'weekly-top joyi saqlangan'
);

const root = path.join(__dirname, '../../my-movie/src');
const api = fs.readFileSync(path.join(root, 'api/recommendationsApi.js'), 'utf8');
const hook = fs.readFileSync(path.join(root, 'hooks/useMostWatchedMovies.js'), 'utf8');
const ui = fs.readFileSync(
  path.join(root, 'components/SearchModalMovieTrending/SearchModalMovieTrending.jsx'),
  'utf8'
);
const page = fs.readFileSync(path.join(root, 'pages/RecommendedPage.jsx'), 'utf8');
const weeklyUi = fs.readFileSync(
  path.join(root, 'components/WeeklyTopMovies/WeeklyTopMovies.jsx'),
  'utf8'
);

assert(api.includes('/recommendations/most-watched'), 'FE GET most-watched');
assert(!api.includes('most-watched') || api.includes('weekly-top'), 'weekly-top FE saqlangan');
assert(hook.includes('fetchMostWatchedMovies'), 'hook most-watched');
assert(ui.includes('useMostWatchedMovies'), 'search trend hook');
assert(ui.includes('/recommended/hozir-trendda'), 'barchasini ko‘rish sahifasi');
assert(page.includes('/recommended/hozir-trendda'), 'recommended trend sahifa');
assert(!weeklyUi.includes('most-watched'), 'hafta UI trendga ulanmagan');
assert(!weeklyUi.includes('useMostWatchedMovies'), 'hafta hook alohida');

console.log('\nmost-watched verify ok');
