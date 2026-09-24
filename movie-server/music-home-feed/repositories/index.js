/**
 * Mavjud musiqa jadvallaridan faqat o'qish.
 * insert / update / delete yo'q. Bo'lim API si chaqirilmaydi.
 *
 * @module music-home-feed/repositories
 */

'use strict';

const { listPersonalCandidates } = require('./sectionRecommendations.read');
const { listTrendingCandidates } = require('./trending.read');
const { listListenProgress } = require('./listenProgress.read');
const { listListenEvents } = require('./listenEvents.read');
const { isListenedTrack } = require('./listened');
const {
  findCatalogTracks,
  findCatalogTracksByIds,
  findRankMetaByIds,
} = require('./catalog.read');
const {
  musicContentType,
  excludedContentTypes,
  isMusicContentType,
  musicContentMatch,
} = require('./musicContent');

module.exports = {
  listPersonalCandidates,
  listTrendingCandidates,
  listListenProgress,
  listListenEvents,
  isListenedTrack,
  findCatalogTracks,
  findCatalogTracksByIds,
  findRankMetaByIds,
  musicContentType,
  excludedContentTypes,
  isMusicContentType,
  musicContentMatch,
};
