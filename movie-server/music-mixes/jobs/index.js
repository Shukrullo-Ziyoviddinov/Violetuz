/**
 * Mix fon ishlari. Kino va musiqa bo'limi navbatidan alohida.
 *
 * @module music-mixes/jobs
 */

'use strict';

const {
  enqueueMixPlay,
  playQueueSize,
  flushPlayQueue,
} = require('./playEventQueue');
const {
  refreshMusicMixes,
  startMusicMixPrecomputeScheduler,
  stopMusicMixPrecomputeScheduler,
} = require('./musicMixPrecompute.job');

module.exports = {
  enqueueMixPlay,
  playQueueSize,
  flushPlayQueue,
  refreshMusicMixes,
  startMusicMixPrecomputeScheduler,
  stopMusicMixPrecomputeScheduler,
};
