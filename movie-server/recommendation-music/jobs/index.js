/**
 * Music recommendation jobs — dedicated musicRecommendationQueue.
 *
 * @module recommendation-music/jobs
 */

'use strict';

const { musicRecommendationQueue } = require('./musicQueue');
const {
  registerAffinityUpdateJob,
  enqueueAffinityUpdate,
  JOB_NAME: AFFINITY_JOB,
} = require('./affinityUpdate.job');
const {
  registerPrecomputeRecommendationsJob,
  enqueuePrecomputeRecommendations,
  JOB_NAME: PRECOMPUTE_JOB,
} = require('./precomputeRecommendations.job');
const {
  registerTrendingPrecomputeJob,
  enqueueTrendingPrecompute,
  startMusicTrendingPrecomputeScheduler,
  stopMusicTrendingPrecomputeScheduler,
  JOB_NAME: TRENDING_JOB,
} = require('./trendingPrecompute.job');

registerAffinityUpdateJob(musicRecommendationQueue);
registerPrecomputeRecommendationsJob(musicRecommendationQueue);
registerTrendingPrecomputeJob(musicRecommendationQueue);

/**
 * Call after connectDB — reload pending durable music:* jobs.
 * @returns {Promise<{ recovered: number }>}
 */
const startMusicRecommendationQueueRecovery = () =>
  musicRecommendationQueue.recoverFromDurableStore();

module.exports = {
  musicRecommendationQueue,
  /** @deprecated alias — use musicRecommendationQueue */
  recommendationQueue: musicRecommendationQueue,
  registerAffinityUpdateJob,
  enqueueAffinityUpdate,
  registerPrecomputeRecommendationsJob,
  enqueuePrecomputeRecommendations,
  registerTrendingPrecomputeJob,
  enqueueTrendingPrecompute,
  startMusicTrendingPrecomputeScheduler,
  stopMusicTrendingPrecomputeScheduler,
  startMusicRecommendationQueueRecovery,
  AFFINITY_JOB,
  PRECOMPUTE_JOB,
  TRENDING_JOB,
};
