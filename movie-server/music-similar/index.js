/**
 * Music / klip / albom detail "Shunga o'xshash" moduli.
 *
 * config + catalog + engine + cache + job + cache-only API.
 * movie-similar / recommendation / recommendation-music ga ulanmaydi.
 *
 * @module music-similar
 */

'use strict';

const { similarityWeights } = require('./config/similarityWeights');
const models = require('./models');
const repositories = require('./repositories');
const services = require('./services');
const jobs = require('./jobs');
const routes = require('./routes');

module.exports = {
  similarityWeights,
  models,
  repositories,
  services,
  jobs,
  routes,
};
