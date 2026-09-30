/**
 * Movie detail "Shunga o'xshash kinolar" moduli.
 *
 * Hozir: config + franshiza maydon kelishuvi.
 * recommendation / home-feed / boshqa engine fayllariga ulanmaydi.
 *
 * @module movie-similar
 */

'use strict';

const { similarityWeights } = require('./config/similarityWeights');
const models = require('./models');
const services = require('./services');
const repositories = require('./repositories');
const jobs = require('./jobs');
const routes = require('./routes');

module.exports = {
  similarityWeights,
  models,
  services,
  repositories,
  jobs,
  routes,
};
