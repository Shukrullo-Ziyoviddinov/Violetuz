/**
 * Haftaning top musiqalari — faqat ListenEvent o‘qish.
 * Progress, affinity, ContentView ga yozilmaydi.
 *
 * Eventdagi listenedSeconds = o‘sha paytdagi progress maksimumi (sessiya deltasi emas).
 * Shu sabab bir user×contentKey uchun oynadagi $max olinadi, keyin userlar bo‘yicha yig‘iladi.
 * viewCount = distinct userId (qayta eshitish +1 emas).
 * Tartib: musicListenStatsRanker → umumiy rankByViewsThenSeconds.
 *
 * @module recommendation-music/services/weeklyTopMusicRead.service
 */

'use strict';

const { ListenEvent } = require('../models');
const { weeklyTopMusicConfig } = require('../config/weeklyTopMusic.config');
const { rankMusicListenStats } = require('../utils/musicListenStatsRanker');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * @param {Date} since
 * @param {Date} now
 * @param {string} contentType
 * @returns {object[]}
 */
const buildWeeklyMusicListenPipeline = (since, now, contentType) => [
  {
    $match: {
      listenedAt: { $gte: since, $lte: now },
      contentType,
      contentKey: { $type: 'string', $ne: '' },
      userId: { $exists: true, $ne: null },
    },
  },
  {
    $group: {
      _id: { contentKey: '$contentKey', userId: '$userId' },
      listenedSeconds: { $max: '$listenedSeconds' },
      contentId: { $first: '$contentId' },
    },
  },
  {
    $group: {
      _id: '$_id.contentKey',
      viewCount: { $sum: 1 },
      listenedSeconds: { $sum: '$listenedSeconds' },
      contentId: { $first: '$contentId' },
    },
  },
  {
    $project: {
      _id: 0,
      contentKey: '$_id',
      contentId: 1,
      viewCount: 1,
      listenedSeconds: 1,
    },
  },
];

/**
 * @param {{ now?: Date, windowDays?: number, contentType?: string }} [opts]
 * @returns {Promise<Array<{ contentKey: string, contentId: string, viewCount: number, listenedSeconds: number }>>}
 */
const readWeeklyMusicListenStats = async (opts = {}) => {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const windowDaysRaw = Number(opts.windowDays);
  const windowDays =
    Number.isFinite(windowDaysRaw) && windowDaysRaw > 0
      ? windowDaysRaw
      : weeklyTopMusicConfig.weeklyWindowDays;
  const contentType =
    typeof opts.contentType === 'string' && opts.contentType.trim()
      ? opts.contentType.trim()
      : weeklyTopMusicConfig.contentType;
  const since = new Date(now.getTime() - windowDays * MS_PER_DAY);

  const rows = await ListenEvent.aggregate(
    buildWeeklyMusicListenPipeline(since, now, contentType)
  );
  return Array.isArray(rows) ? rows : [];
};

/**
 * Read + music adapter ranker. Writes nothing.
 *
 * @param {{ now?: Date, windowDays?: number, limit?: number, minViews?: number }} [opts]
 */
const getWeeklyTopMusicFromListenEvents = async (opts = {}) => {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const windowDaysRaw = Number(opts.windowDays);
  const windowDays =
    Number.isFinite(windowDaysRaw) && windowDaysRaw > 0
      ? windowDaysRaw
      : weeklyTopMusicConfig.weeklyWindowDays;

  const stats = await readWeeklyMusicListenStats({
    now,
    windowDays,
    contentType: weeklyTopMusicConfig.contentType,
  });

  const items = rankMusicListenStats(stats, {
    limit: opts.limit,
    minViews: opts.minViews,
    maxLimit: weeklyTopMusicConfig.topMaxLimit,
  });

  return {
    items,
    windowDays,
    limit: weeklyTopMusicConfig.topLimit,
    minViews: weeklyTopMusicConfig.minViews,
    contentType: weeklyTopMusicConfig.contentType,
    source: items.length ? 'weekly_top_music' : 'empty',
  };
};

module.exports = {
  buildWeeklyMusicListenPipeline,
  readWeeklyMusicListenStats,
  getWeeklyTopMusicFromListenEvents,
};
