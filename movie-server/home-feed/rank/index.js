/**
 * Tartib: normallash → takror → slot → diversity.
 *
 * @module home-feed/rank
 */

'use strict';

const { normalizeSourceRows } = require('./normalize');
const { scoreAndDedupe } = require('./scoreCandidates');
const { spreadPattern, mixSlots } = require('./slotMix');
const { diversifyFeed } = require('./diversify');
const { buildHomeFeed } = require('./buildFeed');

module.exports = {
  normalizeSourceRows,
  scoreAndDedupe,
  spreadPattern,
  mixSlots,
  diversifyFeed,
  buildHomeFeed,
};
