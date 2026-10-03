/**
 * music-similar fon ishlari.
 * movie-similar / recommendation / music-mixes navbatidan alohida.
 *
 * @module music-similar/jobs
 */

'use strict';

const {
  refreshAllSimilarForType,
  refreshAllSimilarMusicItems,
  startMusicSimilarityPrecomputeScheduler,
  stopMusicSimilarityPrecomputeScheduler,
} = require('./musicSimilarityPrecompute.job');

module.exports = {
  refreshAllSimilarForType,
  refreshAllSimilarMusicItems,
  startMusicSimilarityPrecomputeScheduler,
  stopMusicSimilarityPrecomputeScheduler,
};
