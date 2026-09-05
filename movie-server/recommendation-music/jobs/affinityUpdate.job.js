/**
 * Background job: refresh music affinity dimensions after a listen event.
 * Job name: music:affinity:update
 *
 * @module recommendation-music/jobs/affinityUpdate.job
 */

'use strict';

const { musicRecommendationQueue } = require('./musicQueue');
const { findListenEventById } = require('../repositories/listenEvent.repository');
const {
  findContentProjection,
  findContentProjectionByKey,
} = require('../repositories/contentProjection.repository');
const { markAffinityCompletion } = require('../repositories/userProgress.repository');
const { applyListenToAffinities } = require('../services/affinity.service');
const { enqueuePrecomputeRecommendations } = require('./precomputeRecommendations.job');
const { normalizeContentType } = require('../utils/contentKey');

const JOB_NAME = 'music:affinity:update';

const handleAffinityUpdate = async (payload = {}) => {
  let listen = null;

  if (payload.listenEventId) {
    listen = await findListenEventById(payload.listenEventId);
    if (!listen) {
      throw new Error(`ListenEvent not found: ${payload.listenEventId}`);
    }
  } else {
    listen = payload;
  }

  if (!listen.userId || !listen.contentKey || !listen.category) {
    throw new Error('music:affinity:update requires userId, contentKey, category');
  }

  let content = payload.content || null;
  if (!content && !listen.dimensionSnapshot) {
    content =
      (await findContentProjectionByKey(listen.contentKey)) ||
      (await findContentProjection(listen.contentType, listen.contentId));
  }

  const affinityResult = await applyListenToAffinities({
    userId: listen.userId,
    contentKey: listen.contentKey,
    contentType: listen.contentType,
    contentId: listen.contentId,
    category: listen.category,
    completionRate: listen.completionRate,
    liked: listen.liked,
    dimensionSnapshot: listen.dimensionSnapshot || payload.dimensionSnapshot || null,
    content,
    listenEventId: listen._id || payload.listenEventId || null,
  });

  try {
    await markAffinityCompletion(
      listen.userId,
      listen.contentKey,
      listen.completionRate ?? 0
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      '[recommendation-music] markAffinityCompletion failed:',
      err?.message || err
    );
  }

  let precomputeQueued = false;
  if (payload.skipPrecompute !== true) {
    const contentType = normalizeContentType(
      listen.contentType || content?.contentType
    );
    enqueuePrecomputeRecommendations({
      userId: listen.userId,
      category: listen.category,
      contentType: contentType || undefined,
    });
    precomputeQueued = true;
  }

  return {
    affinity: affinityResult,
    precomputeQueued,
  };
};

const registerAffinityUpdateJob = (queue = musicRecommendationQueue) => {
  queue.register(JOB_NAME, handleAffinityUpdate);
  return JOB_NAME;
};

const enqueueAffinityUpdate = (payload = {}, queue = musicRecommendationQueue) => {
  const userId = payload.userId != null ? String(payload.userId) : '';
  const contentKey =
    payload.contentKey != null
      ? String(payload.contentKey)
      : payload.content?.contentKey != null
        ? String(payload.content.contentKey)
        : '';
  const coalesceKey =
    userId && contentKey ? `music:affinity:${userId}:${contentKey}` : null;

  return queue.enqueue(JOB_NAME, payload, { coalesceKey });
};

module.exports = {
  JOB_NAME,
  handleAffinityUpdate,
  registerAffinityUpdateJob,
  enqueueAffinityUpdate,
};
