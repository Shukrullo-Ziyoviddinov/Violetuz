/**
 * "Siz uchun" moduli — config, modellar va mavjud jadvallardan faqat o'qish.
 *
 * Bo'lim algoritmi (recommendation/) o'zgartirilmaydi.
 * O'qish: user tavsiya cache, trend, ko'rish progressi. Yozuv yo'q.
 *
 * @module home-feed
 */

'use strict';

const { sourceTypes, homeFeedWeights } = require('./config/homeFeedWeights');
const models = require('./models');
const repositories = require('./repositories');
const sources = require('./sources');
const rank = require('./rank');
const { buildGuestHomeFeed } = require('./services/guestFeed.service');
const { getLoginHomeFeed } = require('./services/loginFeed.service');
const jobs = require('./jobs');
const routes = require('./routes');

module.exports = {
  sourceTypes,
  homeFeedWeights,
  models,
  repositories,
  sources,
  rank,
  buildGuestHomeFeed,
  getLoginHomeFeed,
  jobs,
  routes,
};
