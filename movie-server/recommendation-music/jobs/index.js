/**
 * Music recommendation jobs — register on shared recommendationQueue.
 *
 * @module recommendation-music/jobs
 */

'use strict';

const { recommendationQueue } = require('../../recommendation/jobs/inProcessQueue');
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

registerAffinityUpdateJob(recommendationQueue);
registerPrecomputeRecommendationsJob(recommendationQueue);

module.exports = {
  recommendationQueue,
  registerAffinityUpdateJob,
  enqueueAffinityUpdate,
  registerPrecomputeRecommendationsJob,
  enqueuePrecomputeRecommendations,
  AFFINITY_JOB,
  PRECOMPUTE_JOB,
};
