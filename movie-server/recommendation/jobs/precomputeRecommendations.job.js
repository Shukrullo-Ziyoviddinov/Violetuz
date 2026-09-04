/**
 * Background job: precompute diversified Top-N into user_recommendations.
 *
 * Job name: recommendations:precompute
 * Payload: { userId, category, topN?, candidatePoolSize? }
 *
 * @module recommendation/jobs/precomputeRecommendations.job
 */

'use strict';

const { recommendationQueue } = require('./inProcessQueue');
const { precomputeUserCategoryRecommendations } = require('../services/precompute.service');

const JOB_NAME = 'recommendations:precompute';

/**
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
const handlePrecomputeRecommendations = async (payload = {}) => {
  const { userId, category } = payload;
  if (!userId || !category) {
    throw new Error('recommendations:precompute requires userId and category');
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

/**
 * Fire-and-forget enqueue.
 * @param {{ userId: *, category: string, topN?: number, candidatePoolSize?: number }} payload
 * @param {import('./inProcessQueue').InProcessQueue} [queue]
 */
const enqueuePrecomputeRecommendations = (payload, queue = recommendationQueue) => {
  const userId = payload?.userId != null ? String(payload.userId) : '';
  const category = String(payload?.category || '').trim();
  const coalesceKey =
    userId && category ? `precompute:${userId}:${category}` : null;

  return queue.enqueue(JOB_NAME, payload, { coalesceKey });
};

module.exports = {
  JOB_NAME,
  handlePrecomputeRecommendations,
  registerPrecomputeRecommendationsJob,
  enqueuePrecomputeRecommendations,
};
