/**
 * "Siz uchun albomlar" fon ishlari.
 * music-home-feed jobiga qo'shilmaydi. Bo'lim navbatiga yozilmaydi.
 *
 * @module album-home-feed/jobs
 */

'use strict';

const {
  refreshAlbumHomeFeeds,
  startAlbumHomeFeedRefreshScheduler,
  stopAlbumHomeFeedRefreshScheduler,
} = require('./albumHomeFeedRefresh.job');
const {
  pairsFromAlbumListeners,
  refreshAlbumCoListen,
  startAlbumCoListenScheduler,
  stopAlbumCoListenScheduler,
} = require('./coListen.job');

const startAlbumHomeFeedSchedulers = (options = {}) => {
  const feed = startAlbumHomeFeedRefreshScheduler(options.feed || {});
  const coListen = startAlbumCoListenScheduler(options.coListen || {});
  return { feed, coListen };
};

const stopAlbumHomeFeedSchedulers = () => {
  stopAlbumHomeFeedRefreshScheduler();
  stopAlbumCoListenScheduler();
};

module.exports = {
  refreshAlbumHomeFeeds,
  refreshAlbumCoListen,
  pairsFromAlbumListeners,
  startAlbumHomeFeedSchedulers,
  stopAlbumHomeFeedSchedulers,
  startAlbumHomeFeedRefreshScheduler,
  stopAlbumHomeFeedRefreshScheduler,
  startAlbumCoListenScheduler,
  stopAlbumCoListenScheduler,
};
