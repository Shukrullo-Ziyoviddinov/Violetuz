/**
 * Background job: precompute music Top-N.
 * Job name: music:recommendations:precompute
 *
 * @module recommendation-music/jobs/precomputeRecommendations.job
 */

'use strict';

const { recommendationQueue } = require('../../recommendation/jobs/inProcessQueue');
const { precomputeUserCategoryRecommendations } = require('../services/precompute.service');

const JOB_NAME = 'music:recommendations:precompute';

const handlePrecomputeRecommendations = async (payload = {}) => {
  const { userId, category } = payload;
  if (!userId || !category) {
    throw new Error('music:recommendations:precompute requires userId and category');
  }

  return precomputeUserCategoryRecommendations(userId, category, {
    topN: payload.topN,
    candidatePoolSize: payload.candidatePoolSize,
    now: payload.now,
  });
};

const registerPrecomputeRecommendationsJob = (queue = recommendationQueue) => {
  queue.register(JOB_NAME, handlePrecomputeRecommendations);
  return JOB_NAME;
};

const enqueuePrecomputeRecommendations = (payload, queue = recommendationQueue) => {
  const userId = payload?.userId != null ? String(payload.userId) : '';
  const category = String(payload?.category || '').trim();
  const coalesceKey =
    userId && category ? `music:precompute:${userId}:${category}` : null;

  return queue.enqueue(JOB_NAME, payload, { coalesceKey });
};

module.exports = {
  JOB_NAME,
  handlePrecomputeRecommendations,
  registerPrecomputeRecommendationsJob,
  enqueuePrecomputeRecommendations,
};
