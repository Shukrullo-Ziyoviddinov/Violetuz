/**
 * "Siz uchun" modellari. Bo'lim recommendation modellari bilan aralashmaydi.
 *
 * @module home-feed/models
 */

'use strict';

const MovieCoOccurrence = require('./MovieCoOccurrence.model');
const HomeFeedCache = require('./HomeFeedCache.model');

module.exports = {
  MovieCoOccurrence,
  HomeFeedCache,
};
