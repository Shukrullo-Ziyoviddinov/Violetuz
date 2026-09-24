/**
 * "Sizga mos musiqalar" fon ishlari. Bo'lim navbatiga yozilmaydi.
 *
 * @module music-home-feed/jobs
 */

'use strict';

const {
  refreshMusicHomeFeeds,
  startMusicHomeFeedRefreshScheduler,
  stopMusicHomeFeedRefreshScheduler,
} = require('./musicHomeFeedRefresh.job');
const {
  pairsFromListeners,
  refreshCoListen,
  startCoListenScheduler,
  stopCoListenScheduler,
} = require('./coListen.job');

const startMusicHomeFeedSchedulers = (options = {}) => {
  const feed = startMusicHomeFeedRefreshScheduler(options.feed || {});
  const coListen = startCoListenScheduler(options.coListen || {});
  return { feed, coListen };
};

const stopMusicHomeFeedSchedulers = () => {
  stopMusicHomeFeedRefreshScheduler();
  stopCoListenScheduler();
};

module.exports = {
  refreshMusicHomeFeeds,
  refreshCoListen,
  pairsFromListeners,
  startMusicHomeFeedSchedulers,
  stopMusicHomeFeedSchedulers,
  startMusicHomeFeedRefreshScheduler,
  stopMusicHomeFeedRefreshScheduler,
  startCoListenScheduler,
  stopCoListenScheduler,
};
