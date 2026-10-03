/**
 * music-similar repositories.
 * Catalog o'qish + similar cache — modul ichida.
 *
 * @module music-similar/repositories
 */

'use strict';

const catalogRead = require('./catalog.read');
const similarCacheRepository = require('./similarCache.repository');

module.exports = {
  ...catalogRead,
  ...similarCacheRepository,
};

