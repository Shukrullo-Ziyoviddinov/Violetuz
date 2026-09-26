/**
 * Katalogdan faqat o'qish. Marta music_mix_play_counts ga yoziladi.
 *
 * @module music-mixes/repositories
 */

'use strict';

const {
  resolveMixGenre,
  findMixSongsByIds,
} = require('./catalog.read');
const { incrementMixPlayCount, listMixPlayCounts } = require('./playCount.repository');
const { replaceUserMixes } = require('./musicMix.repository');

module.exports = {
  resolveMixGenre,
  findMixSongsByIds,
  incrementMixPlayCount,
  listMixPlayCounts,
  replaceUserMixes,
};
