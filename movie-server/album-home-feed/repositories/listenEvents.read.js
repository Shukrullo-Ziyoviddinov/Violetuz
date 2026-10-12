/**
 * Tinglash hodisasi — faqat o'qish.
 * Collection: music_recommendation_listen_events
 * Yangi hodisa yozilmaydi. Faqat contentType album.
 *
 * Hodisa yozuvida albom davomiyligi yo'q. Eshik recommendation-music
 * formulasiga listenedSeconds va completionRate bilan beriladi.
 *
 * @module album-home-feed/repositories/listenEvents.read
 */

'use strict';

const { ListenEvent } = require('../../recommendation-music/models');
const { isAlbumContentType, albumContentMatch } = require('./albumContent');
const { parseUserId } = require('./parseUserId');
const { isListenedAlbum } = require('./listened');

const DEFAULT_LIMIT = 2000;

/**
 * @param {{ userId?: string|import('mongoose').Types.ObjectId, limit?: number }} [options]
 * @returns {Promise<Array<{ userId: string, contentId: string, category: string, listenedSeconds: number, completionRate: number, durationSec: number|null, listenedAt: Date|null, listened: boolean }>>}
 */
const listListenEvents = async (options = {}) => {
  const limit = Math.max(1, Number(options.limit) || DEFAULT_LIMIT);
  /** @type {Object} */
  const filter = { ...albumContentMatch() };
  if (options.userId != null) {
    const uid = parseUserId(options.userId);
    if (!uid) return [];
    filter.userId = uid;
  }

  const rows = await ListenEvent.find(filter)
    .select({
      userId: 1,
      contentId: 1,
      contentType: 1,
      category: 1,
      listenedSeconds: 1,
      completionRate: 1,
      listenedAt: 1,
      _id: 0,
    })
    .sort({ listenedAt: -1 })
    .limit(limit)
    .lean();

  /** @type {Array<{ userId: string, contentId: string, category: string, listenedSeconds: number, completionRate: number, durationSec: number|null, listenedAt: Date|null, listened: boolean }>} */
  const out = [];
  for (const row of rows || []) {
    if (!isAlbumContentType(row.contentType)) continue;
    const contentId = String(row.contentId || '').trim();
    const category = String(row.category || '').trim();
    const userId = String(row.userId || '').trim();
    if (!contentId || !category || !userId) continue;
    const listenedSeconds = Math.max(0, Number(row.listenedSeconds) || 0);
    const completionRate = Math.min(1, Math.max(0, Number(row.completionRate) || 0));
    out.push({
      userId,
      contentId,
      category,
      listenedSeconds,
      completionRate,
      durationSec: null,
      listenedAt: row.listenedAt || null,
      listened: isListenedAlbum(listenedSeconds, completionRate, null),
    });
  }
  return out;
};

module.exports = {
  listListenEvents,
};
