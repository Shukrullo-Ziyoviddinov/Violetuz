/**
 * Listen progress orchestrator.
 *
 * Routes:
 *   album  → multi-track sum (upsertAlbumTrackProgress)
 *   else   → single timeline MAX (upsertMaxProgress)
 *
 * Shared after-write:
 *   ContentView mark + ListenEvent → affinity queue
 *   Affinity strength = f(completionRate)  (see utils/decay.computeListenBoost)
 *
 * @module recommendation-music/services/progress.service
 */

'use strict';

const ContentView = require('../../models/ContentView.model');
const { scoringWeights } = require('../config/scoringWeights');
const { findContentProjection } = require('../repositories/contentProjection.repository');
const {
  findProgress,
  upsertMaxProgress,
  upsertAlbumTrackProgress,
} = require('../repositories/userProgress.repository');
const { recordListenEvent, ensureJobsRegistered } = require('./listenEvent.service');
const { badRequest, notFound } = require('../../utils/errors');
const {
  toContentKey,
  normalizeContentType,
  isValidContentType,
} = require('../utils/contentKey');
const {
  isListenGateOpen,
  resolveCompletionRate,
  shouldQueueAffinity,
  toProgressClientPayload,
  isAlbumReportAcceptable,
  getProgressConfig,
} = require('../utils/progressRules');

/**
 * ContentView — "tinglandi / ko'rildi" (unique user×type×itemId).
 */
const ensureContentViewMarked = async (userId, contentType, contentId) => {
  const viewType = scoringWeights.contentViewTypeByContentType[contentType];
  if (!viewType) return false;

  try {
    await ContentView.create({
      userId,
      type: viewType,
      itemId: String(contentId),
    });
    return true;
  } catch (err) {
    if (err?.code === 11000) return false;
    throw err;
  }
};

/**
 * Progress oshganda: ContentView + ListenEvent (affinity job).
 *
 * @returns {Promise<{ firstMark: boolean, affinityQueued: boolean }>}
 */
const commitListenSignals = async ({
  userId,
  content,
  contentKey,
  category,
  progress,
  needsAffinity,
}) => {
  if (!needsAffinity) {
    return { firstMark: false, affinityQueued: false };
  }

  const lastAffinity =
    typeof progress.lastAffinityCompletion === 'number'
      ? progress.lastAffinityCompletion
      : -1;

  const contentCreated = await ensureContentViewMarked(
    userId,
    content.contentType,
    content.id
  );

  await recordListenEvent({
    userId,
    contentType: content.contentType,
    contentId: content.id,
    contentKey,
    category,
    completionRate: progress.completionRate,
    listenedSeconds: progress.listenedSeconds,
    content,
  });

  return {
    firstMark: contentCreated || lastAffinity < 0,
    affinityQueued: true,
  };
};

const ignoredBelowThreshold = (listenedSeconds, completionRate) => ({
  ignored: true,
  reason: 'below_threshold',
  listenedSeconds,
  completionRate,
});

const unchangedResult = (progress) => ({
  ignored: false,
  updated: false,
  progress: toProgressClientPayload(progress),
  firstMark: false,
  affinityQueued: false,
});

/**
 * music | clip | concert — bitta media, MAX sekund + completion.
 */
const reportSingleContentProgress = async ({
  userId,
  content,
  category,
  contentKey,
  listenedSeconds,
  completionRate,
  durationSec,
}) => {
  if (!isListenGateOpen(listenedSeconds, completionRate, durationSec)) {
    return ignoredBelowThreshold(listenedSeconds, completionRate);
  }

  const { progress, previous, raised } = await upsertMaxProgress({
    userId,
    contentKey,
    contentType: content.contentType,
    contentId: String(content.id),
    category,
    listenedSeconds,
    completionRate,
  });

  const needsAffinity = shouldQueueAffinity(progress);
  if (!raised && !needsAffinity) {
    return unchangedResult(progress);
  }

  const { firstMark, affinityQueued } = await commitListenSignals({
    userId,
    content,
    contentKey,
    category,
    progress,
    needsAffinity,
  });

  return {
    ignored: false,
    updated: raised || affinityQueued,
    firstMark,
    affinityQueued,
    progress: toProgressClientPayload(progress),
    previousListenedSeconds: previous?.listenedSeconds ?? 0,
  };
};

/**
 * album — trek MAX yig‘indisi; ContentView = album id.
 */
const reportAlbumProgress = async ({
  userId,
  content,
  category,
  contentKey,
  input,
  listenedSeconds,
  durationSec,
}) => {
  const trackId = input.trackId ?? input.albumSongId ?? input.songId;
  const trackListenedSeconds = Math.max(
    0,
    Number(input.trackListenedSeconds ?? listenedSeconds) || 0
  );
  const albumDurationSec =
    typeof input.albumDurationSec === 'number' && Number.isFinite(input.albumDurationSec)
      ? Math.max(0, input.albumDurationSec)
      : null;

  const existing = await findProgress(userId, contentKey);
  if (!isAlbumReportAcceptable(existing, trackListenedSeconds, durationSec)) {
    return ignoredBelowThreshold(trackListenedSeconds, 0);
  }

  const { progress, previous, raised } = await upsertAlbumTrackProgress({
    userId,
    contentKey,
    contentType: 'album',
    contentId: String(content.id),
    category,
    trackId: trackId != null && trackId !== '' ? trackId : 'unknown',
    trackListenedSeconds,
    trackDurationSec: durationSec,
    albumDurationSec,
  });

  const { minSec } = getProgressConfig();
  const albumGateOpen = (progress.listenedSeconds || 0) >= minSec;
  const needsAffinity = albumGateOpen && shouldQueueAffinity(progress);

  if (!raised && !needsAffinity) {
    return unchangedResult(progress);
  }

  // Gate ochilgan, affinity hali kerak emas — faqat ContentView (birinchi marta)
  if (albumGateOpen && !needsAffinity) {
    const lastAffinity =
      typeof progress.lastAffinityCompletion === 'number'
        ? progress.lastAffinityCompletion
        : -1;
    let firstMark = false;
    if (lastAffinity < 0) {
      firstMark = await ensureContentViewMarked(userId, 'album', content.id);
    }
    return {
      ignored: false,
      updated: raised || firstMark,
      firstMark,
      affinityQueued: false,
      progress: toProgressClientPayload(progress),
      previousListenedSeconds: previous?.listenedSeconds ?? 0,
    };
  }

  const { firstMark, affinityQueued } = await commitListenSignals({
    userId,
    content,
    contentKey,
    category,
    progress,
    needsAffinity,
  });

  return {
    ignored: false,
    updated: raised || affinityQueued,
    firstMark,
    affinityQueued,
    progress: toProgressClientPayload(progress),
    previousListenedSeconds: previous?.listenedSeconds ?? 0,
  };
};

/**
 * HTTP / player entry: progress report.
 *
 * @param {*} userId
 * @param {Object} input
 */
const reportMusicProgress = async (userId, input = {}) => {
  ensureJobsRegistered();

  if (!userId) throw badRequest('userId majburiy');

  const contentType = normalizeContentType(input.contentType || input.type);
  const contentId = input.contentId ?? input.id;
  if (!isValidContentType(contentType)) {
    throw badRequest('contentType majburiy (music|album|clip|concert)');
  }
  if (contentId === undefined || contentId === null || contentId === '') {
    throw badRequest('contentId majburiy');
  }

  const listenedSeconds = Math.max(
    0,
    Number(input.listenedSeconds ?? input.watchedSeconds) || 0
  );
  const durationSec =
    typeof input.durationSec === 'number' && Number.isFinite(input.durationSec)
      ? Math.max(0, input.durationSec)
      : null;
  const completionRate = resolveCompletionRate(
    listenedSeconds,
    durationSec,
    input.completionRate
  );

  const content = await findContentProjection(contentType, contentId);
  if (!content) throw notFound(`Content not found: ${contentType}:${contentId}`);

  const category = String(input.category || content.categoryNameMusic || '').trim();
  if (!category) throw badRequest('category (categoryNameMusic) majburiy');

  const contentKey = toContentKey(content.contentType, content.id);
  const ctx = {
    userId,
    content,
    category,
    contentKey,
    listenedSeconds,
    completionRate,
    durationSec,
    input,
  };

  if (content.contentType === 'album') {
    return reportAlbumProgress(ctx);
  }

  return reportSingleContentProgress(ctx);
};

module.exports = {
  reportMusicProgress,
  /** verify / tests */
  isEligibleProgress: isListenGateOpen,
  isListenGateOpen,
  resolveCompletionRate,
  shouldQueueAffinity,
};
