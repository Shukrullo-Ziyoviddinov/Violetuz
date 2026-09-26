/**
 * "Sizning mixlaringiz" moduli.
 *
 * Hozir: sozlama, jadvallar, katalog, mix martasi, tez POST, yig'ish, fon ishi va o'qish.
 * Kino, musiqa bo'limi va "Siz uchun" fayllariga ulanmaydi.
 * UI ham keyinroq o'z komponentida, mavjud bloklarga qo'shilmaydi.
 *
 * @module music-mixes
 */

'use strict';

const { musicMixWeights } = require('./config/musicMixWeights');
const models = require('./models');
const repositories = require('./repositories');
const services = require('./services');
const jobs = require('./jobs');
const routes = require('./routes');

module.exports = {
  musicMixWeights,
  models,
  repositories,
  services,
  jobs,
  routes,
};
