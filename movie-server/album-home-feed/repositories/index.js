/**
 * Albom o'qishlari va albom kesh/juftlik yozuvi.
 * recommendation-music va music-home-feed ga yozilmaydi.
 *
 * @module album-home-feed/repositories
 */

'use strict';

const { listPersonalCandidates } = require('./sectionRecommendations.read');
const { listTrendingCandidates } = require('./trending.read');
const { listListenProgress } = require('./listenProgress.read');
const { listListenEvents } = require('./listenEvents.read');
const { isListenedAlbum } = require('./listened');
const { listCoOccurredAlbums, replaceAlbumCoOccurrence } = require('./coOccurrence.repository');
const {
  listAlbumHomeFeedCache,
  replaceAlbumHomeFeedCache,
} = require('./albumHomeFeedCache.repository');
const {
  findCatalogAlbums,
  findCatalogAlbumsByIds,
  findRankMetaByIds,
} = require('./catalog.read');
const {
  albumContentType,
  excludedContentTypes,
  isAlbumContentType,
  albumContentMatch,
} = require('./albumContent');

module.exports = {
  listPersonalCandidates,
  listTrendingCandidates,
  listListenProgress,
  listListenEvents,
  isListenedAlbum,
  listCoOccurredAlbums,
  replaceAlbumCoOccurrence,
  listAlbumHomeFeedCache,
  replaceAlbumHomeFeedCache,
  findCatalogAlbums,
  findCatalogAlbumsByIds,
  findRankMetaByIds,
  albumContentType,
  excludedContentTypes,
  isAlbumContentType,
  albumContentMatch,
};
