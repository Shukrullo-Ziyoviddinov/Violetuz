/**
 * Katalogdan faqat o'qish. Marta music_mix_play_counts ga yoziladi.
 *
 * @module music-mixes/repositories
 */

'use strict';

const {
  resolveMixGenre,
  findMixSongsByIds,
  findMixClipsByIds,
  findMixCatalogByIds,
} = require('./catalog.read');
const { incrementMixPlayCount, listMixPlayCounts } = require('./playCount.repository');
const { replaceUserMixes } = require('./musicMix.repository');
const { createMixShare, createOrRefreshMixShare, findMixShareByToken, refreshMixShareDocument } = require('./mixShare.repository');

module.exports = {
  resolveMixGenre,
  findMixSongsByIds,
  findMixClipsByIds,
  findMixCatalogByIds,
  incrementMixPlayCount,
  listMixPlayCounts,
  replaceUserMixes,
  createMixShare,
  createOrRefreshMixShare,
  findMixShareByToken,
  refreshMixShareDocument,
};
