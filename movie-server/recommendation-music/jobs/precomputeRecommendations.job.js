/**
 * Background job: precompute music Top-N (per category × contentType).
 * Job name: music:recommendations:precompute
 *
 * @module recommendation-music/jobs/precomputeRecommendations.job
 */

'use strict';

const { musicRecommendationQueue } = require('./musicQueue');
const { precomputeUserCategoryRecommendations } = require('../services/precompute.service');
const { normalizeContentType, isValidContentType } = require('../utils/contentKey');
const { scoringWeights } = require('../config/scoringWeights');

const JOB_NAME = 'music:recommendations:precompute';

const handlePrecomputeRecommendations = async (payload = {}) => {
  const { userId, category } = payload;
  if (!userId || !category) {
    throw new Error('music:recommendations:precompute requires userId and category');
  }

  const contentType = normalizeContentType(payload.contentType);
  const opts = {
    topN: payload.topN,
    candidatePoolSize: payload.candidatePoolSize,
    now: payload.now,
  };

  // Legacy durable jobs without contentType → refresh each type separately.
  if (!contentType || !isValidContentType(contentType)) {
    const results = [];
    for (const type of scoringWeights.contentTypes) {
      results.push(
        await precomputeUserCategoryRecommendations(userId, category, {
          ...opts,
          contentType: type,
        })
      );
    }
    return results;
  }

  return precomputeUserCategoryRecommendations(userId, category, {
    ...opts,
    contentType,
  });
};

const registerPrecomputeRecommendationsJob = (queue = musicRecommendationQueue) => {
  queue.register(JOB_NAME, handlePrecomputeRecommendations);
  return JOB_NAME;
};

const enqueuePrecomputeRecommendations = (payload, queue = musicRecommendationQueue) => {
  const userId = payload?.userId != null ? String(payload.userId) : '';
  const category = String(payload?.category || '').trim();
  const contentType = normalizeContentType(payload?.contentType);
  const coalesceKey =
    userId && category
      ? contentType
        ? `music:precompute:${userId}:${category}:${contentType}`
        : `music:precompute:${userId}:${category}`
      : null;

  return queue.enqueue(JOB_NAME, payload, { coalesceKey });
};

module.exports = {
  JOB_NAME,
  handlePrecomputeRecommendations,
  registerPrecomputeRecommendationsJob,
  enqueuePrecomputeRecommendations,
};
