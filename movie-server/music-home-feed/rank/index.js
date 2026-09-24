/**
 * Tartib: normallash → takror → slot → diversity.
 *
 * @module music-home-feed/rank
 */

'use strict';

const { normalizeSourceRows } = require('./normalize');
const { scoreAndDedupe } = require('./scoreCandidates');
const { spreadPattern, mixSlots } = require('./slotMix');
const { diversifyFeed } = require('./diversify');
const { assembleMusicFeed, buildMusicFeed } = require('./buildFeed');

module.exports = {
  normalizeSourceRows,
  scoreAndDedupe,
  spreadPattern,
  mixSlots,
  diversifyFeed,
  assembleMusicFeed,
  buildMusicFeed,
};
