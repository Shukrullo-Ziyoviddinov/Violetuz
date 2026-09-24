/**
 * "Sizga mos musiqalar" modellari.
 * Kino home-feed va musiqa bo'lim modellari bilan aralashmaydi.
 *
 * @module music-home-feed/models
 */

'use strict';

const MusicCoOccurrence = require('./MusicCoOccurrence.model');
const MusicHomeFeedCache = require('./MusicHomeFeedCache.model');

module.exports = {
  MusicCoOccurrence,
  MusicHomeFeedCache,
};
