/**
 * To'rt manba. Bir-birini chaqirmaydi. Juftlik manbasi yo'q.
 *
 * @module home-feed/sources
 */

'use strict';

const { listPersonalSource } = require('./personal.source');
const { listTrendingSource } = require('./trending.source');
const { listFreshSource } = require('./fresh.source');
const { listExplorationSource } = require('./exploration.source');
const {
  listCollaborativeSource,
  listCollaborativeFromSeeds,
} = require('./collaborative.source');

module.exports = {
  listPersonalSource,
  listTrendingSource,
  listFreshSource,
  listExplorationSource,
  listCollaborativeSource,
  listCollaborativeFromSeeds,
};
