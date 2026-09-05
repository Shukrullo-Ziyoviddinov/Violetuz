/**
 * Record listen event + queue affinity refresh.
 *
 * @module recommendation-music/services/listenEvent.service
 */

'use strict';

const { extractAllDimensionValues } = require('../dimensions');
const {
  findContentProjection,
  findContentProjectionByKey,
} = require('../repositories/contentProjection.repository');
const { createListenEvent } = require('../repositories/listenEvent.repository');
const {
  registerAffinityUpdateJob,
  enqueueAffinityUpdate,
  JOB_NAME,
} = require('../jobs/affinityUpdate.job');
const { registerPrecomputeRecommendationsJob } = require('../jobs/precomputeRecommendations.job');
const { recommendationQueue } = require('../../recommendation/jobs/inProcessQueue');
const { toContentKey, normalizeContentType } = require('../utils/contentKey');

let jobsRegistered = false;

const ensureJobsRegistered = () => {
  if (!jobsRegistered) {
    registerAffinityUpdateJob(recommendationQueue);
    registerPrecomputeRecommendationsJob(recommendationQueue);
    jobsRegistered = true;
  }
};

/**
 * @param {Object} input
 */
const recordListenEvent = async (input) => {
  ensureJobsRegistered();

  const userId = input.userId;
  const contentType = normalizeContentType(input.contentType);
  const contentId = input.contentId ?? input.id;

  if (!userId) {
    const err = new Error('userId is required');
    err.status = 400;
    throw err;
  }
  if (!contentType || contentId === undefined || contentId === null || contentId === '') {
    const err = new Error('contentType and contentId are required');
    err.status = 400;
    throw err;
  }

  const content =
    input.content ||
    (await findContentProjection(contentType, contentId)) ||
    (input.contentKey ? await findContentProjectionByKey(input.contentKey) : null);

  if (!content) {
    const err = new Error(`Content not found: ${contentType}:${contentId}`);
    err.status = 404;
    throw err;
  }

  const category = String(input.category || content.categoryNameMusic || '').trim();
  if (!category) {
    const err = new Error('category (categoryNameMusic) is required');
    err.status = 400;
    throw err;
  }

  const contentKey = toContentKey(content.contentType, content.id);
  const dimensionSnapshot = extractAllDimensionValues(content);

  const listenEvent = await createListenEvent({
    userId,
    contentKey,
    contentType: content.contentType,
    contentId: String(content.id),
    category,
    completionRate: input.completionRate ?? 0,
    listenedSeconds: Math.max(0, Number(input.listenedSeconds) || 0),
    liked: Boolean(input.liked),
    listenedAt: input.listenedAt || new Date(),
    dimensionSnapshot,
  });

  const jobPayload = {
    listenEventId: listenEvent._id,
    userId,
    contentKey,
    contentType: content.contentType,
    contentId: String(content.id),
    category,
    dimensionSnapshot,
    content,
  };

  if (input.waitForAffinity) {
    const affinityResult = await recommendationQueue.enqueueAndWait(JOB_NAME, jobPayload);
    return {
      listenEvent,
      queued: false,
      jobName: JOB_NAME,
      affinityResult,
    };
  }

  enqueueAffinityUpdate(jobPayload);

  return {
    listenEvent,
    queued: true,
    jobName: JOB_NAME,
  };
};

module.exports = {
  recordListenEvent,
  ensureJobsRegistered,
};
