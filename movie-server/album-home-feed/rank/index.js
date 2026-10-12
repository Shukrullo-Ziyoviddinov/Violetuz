/**
 * Albom tartibi: normallash → takror → slot → diversity.
 * music-home-feed chaqirilmaydi.
 *
 * @module album-home-feed/rank
 */

'use strict';

const { normalizeSourceRows } = require('./normalize');
const { scoreAndDedupe } = require('./scoreCandidates');
const { spreadPattern, mixSlots } = require('./slotMix');
const { diversifyFeed } = require('./diversify');
const { assembleAlbumFeed, buildAlbumFeed } = require('./buildFeed');

module.exports = {
  normalizeSourceRows,
  scoreAndDedupe,
  spreadPattern,
  mixSlots,
  diversifyFeed,
  assembleAlbumFeed,
  buildAlbumFeed,
};
