/**
 * Eshitish progressi — faqat o'qish.
 * Collection: music_recommendation_user_progress
 * upsert / affinity yozuvi yo'q.
 *
 * "Tinglandi" — isListenGateOpen. Albom davomiyligi shu progress yozuvidagi
 * albumDurationSec. Katalogdan trek davomiyligi o'qilmaydi.
 * Faqat contentType album.
 *
 * @module album-home-feed/repositories/listenProgress.read
 */

'use strict';

const { UserMusicProgress } = require('../../recommendation-music/models');
const { isAlbumContentType, albumContentMatch } = require('./albumContent');
const { parseUserId } = require('./parseUserId');
const { isListenedAlbum } = require('./listened');

const DEFAULT_LIMIT = 500;

/**
 * @param {unknown} value
 * @returns {number|null}
 */
const albumDurationOrNull = (value) => {
  const duration = Number(value);
  return Number.isFinite(duration) && duration > 0 ? duration : null;
};

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {number} [limit]
 * @returns {Promise<Array<{ contentId: string, category: string, listenedSeconds: number, completionRate: number, durationSec: number|null, updatedAt: Date|null, listened: boolean }>>}
 */
const listListenProgress = async (userId, limit = DEFAULT_LIMIT) => {
  const uid = parseUserId(userId);
  if (!uid) return [];

  const rows = await UserMusicProgress.find({
    userId: uid,
    ...albumContentMatch(),
  })
    .select({
      contentId: 1,
      contentType: 1,
      category: 1,
      listenedSeconds: 1,
      completionRate: 1,
      albumDurationSec: 1,
      updatedAt: 1,
      _id: 0,
    })
    .sort({ updatedAt: -1 })
    .limit(Math.max(1, Number(limit) || DEFAULT_LIMIT))
    .lean();

  /** @type {Array<{ contentId: string, category: string, listenedSeconds: number, completionRate: number, durationSec: number|null, updatedAt: Date|null, listened: boolean }>} */
  const out = [];
  for (const row of rows || []) {
    if (!isAlbumContentType(row.contentType)) continue;
    const contentId = String(row.contentId || '').trim();
    const category = String(row.category || '').trim();
    if (!contentId || !category) continue;
    const listenedSeconds = Math.max(0, Number(row.listenedSeconds) || 0);
    const completionRate = Math.min(1, Math.max(0, Number(row.completionRate) || 0));
    const durationSec = albumDurationOrNull(row.albumDurationSec);
    out.push({
      contentId,
      category,
      listenedSeconds,
      completionRate,
      durationSec,
      updatedAt: row.updatedAt || null,
      listened: isListenedAlbum(listenedSeconds, completionRate, durationSec),
    });
  }
  return out;
};

module.exports = {
  listListenProgress,
};
