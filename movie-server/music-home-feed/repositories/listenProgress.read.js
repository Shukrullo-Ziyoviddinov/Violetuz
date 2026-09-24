/**
 * Eshitish progressi — faqat o'qish.
 * Collection: music_recommendation_user_progress
 * upsert / affinity yozuvi yo'q.
 *
 * "Tinglandi" — isListenGateOpen (10 soniya yoki qisqa trekda 80 foiz).
 * Davomiylik katalogdan o'qiladi, formula nusxalanmaydi.
 * Faqat contentType music.
 *
 * @module music-home-feed/repositories/listenProgress.read
 */

'use strict';

const { UserMusicProgress } = require('../../recommendation-music/models');
const { isMusicContentType, musicContentMatch } = require('./musicContent');
const { parseUserId } = require('./parseUserId');
const { isListenedTrack } = require('./listened');
const { mapDurationByIds } = require('./catalog.read');

const DEFAULT_LIMIT = 500;

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
    ...musicContentMatch(),
  })
    .select({
      contentId: 1,
      contentType: 1,
      category: 1,
      listenedSeconds: 1,
      completionRate: 1,
      updatedAt: 1,
      _id: 0,
    })
    .sort({ updatedAt: -1 })
    .limit(Math.max(1, Number(limit) || DEFAULT_LIMIT))
    .lean();

  const durations = await mapDurationByIds((rows || []).map((row) => row.contentId));

  /** @type {Array<{ contentId: string, category: string, listenedSeconds: number, completionRate: number, durationSec: number|null, updatedAt: Date|null, listened: boolean }>} */
  const out = [];
  for (const row of rows || []) {
    if (!isMusicContentType(row.contentType)) continue;
    const contentId = String(row.contentId || '').trim();
    const category = String(row.category || '').trim();
    if (!contentId || !category) continue;
    const listenedSeconds = Math.max(0, Number(row.listenedSeconds) || 0);
    const completionRate = Math.min(1, Math.max(0, Number(row.completionRate) || 0));
    const durationSec = durations.has(contentId) ? durations.get(contentId) : null;
    out.push({
      contentId,
      category,
      listenedSeconds,
      completionRate,
      durationSec,
      updatedAt: row.updatedAt || null,
      listened: isListenedTrack(listenedSeconds, completionRate, durationSec),
    });
  }
  return out;
};

module.exports = {
  listListenProgress,
};
