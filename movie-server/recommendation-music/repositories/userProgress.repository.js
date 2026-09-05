/**
 * UserMusicProgress access — one row per user × contentKey.
 * Album: per-track max seconds summed (kino completion kabi jami daqiqa).
 *
 * @module recommendation-music/repositories/userProgress.repository
 */

'use strict';

const { UserMusicProgress } = require('../models');
const { scoringWeights } = require('../config/scoringWeights');

const mapToObject = (mapOrObj) => {
  if (!mapOrObj) return {};
  if (mapOrObj instanceof Map) return Object.fromEntries(mapOrObj.entries());
  if (typeof mapOrObj === 'object') return { ...mapOrObj };
  return {};
};

const sumValues = (obj) =>
  Object.values(obj).reduce((sum, n) => sum + (Number(n) || 0), 0);

const findProgress = async (userId, contentKey) =>
  UserMusicProgress.findOne({
    userId,
    contentKey: String(contentKey),
  }).lean();

/**
 * Oddiy content (music/clip/concert): watched MAX upsert.
 */
const upsertMaxProgress = async (input) => {
  const contentKey = String(input.contentKey);
  const contentType = String(input.contentType).trim();
  const contentId = String(input.contentId).trim();
  const category = String(input.category).trim();
  const listenedSeconds = Math.max(0, Number(input.listenedSeconds) || 0);
  const completionRate = Math.min(1, Math.max(0, Number(input.completionRate) || 0));
  const now = new Date();

  const previous = await findProgress(input.userId, contentKey);

  const progress = await UserMusicProgress.findOneAndUpdate(
    { userId: input.userId, contentKey },
    {
      $max: {
        listenedSeconds,
        completionRate,
      },
      $set: {
        category,
        contentType,
        contentId,
        updatedAt: now,
      },
      $setOnInsert: {
        userId: input.userId,
        contentKey,
        lastAffinityCompletion: -1,
      },
    },
    { upsert: true, new: true, lean: true }
  );

  const raised =
    !previous ||
    (progress.listenedSeconds || 0) > (previous.listenedSeconds || 0) + 1e-6 ||
    (progress.completionRate || 0) > (previous.completionRate || 0) + 1e-6;

  return { progress, previous, raised: Boolean(raised) };
};

/**
 * Albom: trek bo‘yicha MAX, keyin jami = sum (14 daqiqa / 23 daqiqa kabi).
 *
 * @param {Object} input
 * @param {string|number} input.trackId — albom ichidagi song.id
 * @param {number} input.trackListenedSeconds — shu trek uchun (session max)
 * @param {number} [input.trackDurationSec]
 * @param {number} [input.albumDurationSec] — client bilsa (5 trek jami)
 */
const upsertAlbumTrackProgress = async (input) => {
  const contentKey = String(input.contentKey);
  const contentType = 'album';
  const contentId = String(input.contentId).trim();
  const category = String(input.category).trim();
  const trackId = String(input.trackId ?? '').trim();
  const trackListenedSeconds = Math.max(0, Number(input.trackListenedSeconds) || 0);
  const trackDurationSec =
    typeof input.trackDurationSec === 'number' && Number.isFinite(input.trackDurationSec)
      ? Math.max(0, input.trackDurationSec)
      : null;
  const albumDurationHint =
    typeof input.albumDurationSec === 'number' && Number.isFinite(input.albumDurationSec)
      ? Math.max(0, input.albumDurationSec)
      : null;

  if (!trackId) {
    // Trek id yo‘q — oddiy max fallback (eski client)
    return upsertMaxProgress({
      ...input,
      contentType,
      listenedSeconds: trackListenedSeconds || input.listenedSeconds,
      completionRate: input.completionRate,
    });
  }

  const previous = await findProgress(input.userId, contentKey);
  const trackSeconds = mapToObject(previous?.trackSeconds);
  const trackDurations = mapToObject(previous?.trackDurations);

  const prevTrack = Number(trackSeconds[trackId]) || 0;
  trackSeconds[trackId] = Math.max(prevTrack, trackListenedSeconds);

  if (trackDurationSec && trackDurationSec > 0) {
    trackDurations[trackId] = Math.max(
      Number(trackDurations[trackId]) || 0,
      trackDurationSec
    );
  }

  const listenedSeconds = sumValues(trackSeconds);
  const durationsSum = sumValues(trackDurations);
  const albumDurationSec = Math.max(
    albumDurationHint || 0,
    Number(previous?.albumDurationSec) || 0,
    durationsSum
  );

  const completionRate =
    albumDurationSec > 0
      ? Math.min(1, Math.max(0, listenedSeconds / albumDurationSec))
      : 0;

  const now = new Date();

  const progress = await UserMusicProgress.findOneAndUpdate(
    { userId: input.userId, contentKey },
    {
      $set: {
        category,
        contentType,
        contentId,
        trackSeconds,
        trackDurations,
        albumDurationSec: albumDurationSec > 0 ? albumDurationSec : null,
        listenedSeconds,
        completionRate,
        updatedAt: now,
      },
      $setOnInsert: {
        userId: input.userId,
        contentKey,
        lastAffinityCompletion: -1,
      },
    },
    { upsert: true, new: true, lean: true }
  );

  const raised =
    !previous ||
    listenedSeconds > (previous.listenedSeconds || 0) + 1e-6 ||
    completionRate > (previous.completionRate || 0) + 1e-6 ||
    trackSeconds[trackId] > prevTrack + 1e-6;

  return {
    progress,
    previous,
    raised: Boolean(raised),
    trackId,
    trackListenedSeconds: trackSeconds[trackId],
  };
};

const markAffinityCompletion = async (userId, contentKey, completionRate) => {
  const rate = Math.min(1, Math.max(0, Number(completionRate) || 0));
  return UserMusicProgress.findOneAndUpdate(
    { userId, contentKey: String(contentKey) },
    {
      $max: { lastAffinityCompletion: rate },
      $set: { updatedAt: new Date() },
    },
    { new: true, lean: true }
  );
};

/**
 * Listened-penalty set (TTL-safe).
 */
const listListenedContentKeys = async (userId, category, limit = 5000) => {
  const cat = String(category || '').trim();
  if (!userId || !cat) return [];

  const cfg = scoringWeights.progress || {};
  const minSec = cfg.minListenedSeconds ?? 10;
  const shortRatio = cfg.shortCompleteRatio ?? 0.8;

  const rows = await UserMusicProgress.find({
    userId,
    category: cat,
    $or: [
      { listenedSeconds: { $gte: minSec } },
      { completionRate: { $gte: shortRatio } },
    ],
  })
    .select({ contentKey: 1, _id: 0 })
    .sort({ updatedAt: -1 })
    .limit(Math.max(1, limit))
    .lean();

  return [...new Set((rows || []).map((r) => String(r.contentKey)).filter(Boolean))];
};

module.exports = {
  findProgress,
  upsertMaxProgress,
  upsertAlbumTrackProgress,
  markAffinityCompletion,
  listListenedContentKeys,
  mapToObject,
  sumValues,
};
