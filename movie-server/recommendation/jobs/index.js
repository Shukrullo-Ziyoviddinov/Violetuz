/**
 * Async jobs: in-process queue + affinity update + Top-N precompute.
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

registerAffinityUpdateJob(recommendationQueue);
registerPrecomputeRecommendationsJob(recommendationQueue);

module.exports = {
  InProcessQueue,
  recommendationQueue,
  AFFINITY_UPDATE_JOB,
  PRECOMPUTE_JOB,
  handleAffinityUpdate,
  registerAffinityUpdateJob,
  enqueueAffinityUpdate,
  handlePrecomputeRecommendations,
  registerPrecomputeRecommendationsJob,
  enqueuePrecomputeRecommendations,
};
