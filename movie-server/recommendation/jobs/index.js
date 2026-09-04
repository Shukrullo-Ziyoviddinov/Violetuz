/**
 * Async jobs: in-process queue + affinity update + Top-N precompute + trending.
 * @module recommendation/jobs
 */

'use strict';

const { InProcessQueue, recommendationQueue } = require('./inProcessQueue');
const {
  JOB_NAME: AFFINITY_UPDATE_JOB,
  handleAffinityUpdate,
  registerAffinityUpdateJob,
  enqueueAffinityUpdate,
} = require('./affinityUpdate.job');
const {
  JOB_NAME: PRECOMPUTE_JOB,
  handlePrecomputeRecommendations,
  registerPrecomputeRecommendationsJob,
  enqueuePrecomputeRecommendations,
} = require('./precomputeRecommendations.job');
const {
  JOB_NAME: TRENDING_PRECOMPUTE_JOB,
  handleTrendingPrecompute,
  registerTrendingPrecomputeJob,
  enqueueTrendingPrecompute,
  startTrendingPrecomputeScheduler,
  stopTrendingPrecomputeScheduler,
} = require('./trendingPrecompute.job');

registerAffinityUpdateJob(recommendationQueue);
registerPrecomputeRecommendationsJob(recommendationQueue);
registerTrendingPrecomputeJob(recommendationQueue);

// Soatlik cron server boot’da (connectDB dan keyin) startTrendingPrecomputeScheduler()
// bilan yoqiladi — test/require paytida Mongo’siz ishga tushmasin.

module.exports = {
  InProcessQueue,
  recommendationQueue,
  AFFINITY_UPDATE_JOB,
  PRECOMPUTE_JOB,
  TRENDING_PRECOMPUTE_JOB,
  handleAffinityUpdate,
  registerAffinityUpdateJob,
  enqueueAffinityUpdate,
  handlePrecomputeRecommendations,
  registerPrecomputeRecommendationsJob,
  enqueuePrecomputeRecommendations,
  handleTrendingPrecompute,
  registerTrendingPrecomputeJob,
  enqueueTrendingPrecompute,
  startTrendingPrecomputeScheduler,
  stopTrendingPrecomputeScheduler,
};
