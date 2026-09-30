/**
 * movie-similar repositories.
 * Catalog o'qish + similar cache — modul ichida.
 *
 * @module movie-similar/repositories
 */

'use strict';

const catalogRead = require('./catalog.read');
const similarCacheRepository = require('./similarCache.repository');

module.exports = {
  ...catalogRead,
  ...similarCacheRepository,
};
