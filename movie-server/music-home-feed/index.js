/**
 * "Sizga mos musiqalar" moduli.
 *
 * Hozir: config, o'qish, manbalar, tartib, mehmon, login kesh va fon ishlari.
 * Kino home-feed va recommendation-music o'zgartirilmaydi.
 * O'qish yozuvsiz. Bo'lim API si chaqirilmaydi.
 *
 * @module music-home-feed
 */

'use strict';

const { sourceTypes, musicHomeFeedWeights } = require('./config/musicHomeFeedWeights');
const models = require('./models');
const repositories = require('./repositories');
const sources = require('./sources');
const rank = require('./rank');
const { buildGuestMusicFeed } = require('./services/guestFeed.service');
const { getLoginMusicFeed } = require('./services/loginFeed.service');
const jobs = require('./jobs');
const routes = require('./routes');

module.exports = {
  sourceTypes,
  musicHomeFeedWeights,
  models,
  repositories,
  sources,
  rank,
  buildGuestMusicFeed,
  getLoginMusicFeed,
  jobs,
  routes,
};
