/**
 * "Siz uchun" fon ishlari. Bo'lim navbatiga yozilmaydi.
 *
 * @module home-feed/jobs
 */

'use strict';

const {
  refreshHomeFeeds,
  startHomeFeedRefreshScheduler,
  stopHomeFeedRefreshScheduler,
} = require('./homeFeedRefresh.job');
const {
  pairsFromWatchers,
  refreshCoOccurrence,
  startCoOccurrenceScheduler,
  stopCoOccurrenceScheduler,
} = require('./coOccurrence.job');

const startHomeFeedSchedulers = (options = {}) => {
  const feed = startHomeFeedRefreshScheduler(options.feed || {});
  const coOccurrence = startCoOccurrenceScheduler(options.coOccurrence || {});
  return { feed, coOccurrence };
};

const stopHomeFeedSchedulers = () => {
  stopHomeFeedRefreshScheduler();
  stopCoOccurrenceScheduler();
};

module.exports = {
  refreshHomeFeeds,
  refreshCoOccurrence,
  pairsFromWatchers,
  startHomeFeedSchedulers,
  stopHomeFeedSchedulers,
  startHomeFeedRefreshScheduler,
  stopHomeFeedRefreshScheduler,
  startCoOccurrenceScheduler,
  stopCoOccurrenceScheduler,
};
