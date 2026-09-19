/**
 * Oyning top musiqalari — faqat ListenEvent o‘qish.
 * Pipeline weekly moduldan (`readWeeklyMusicListenStats`), tartib musicListenStatsRanker.
 * Bu fayl faqat 30 kunlik oyna va o‘z limitini beradi.
 * Progress, affinity, ContentView ga yozilmaydi.
 *
 * @module recommendation-music/services/monthlyTopMusicRead.service
 */

'use strict';

const { monthlyTopMusicConfig } = require('../config/monthlyTopMusic.config');
const {
  readWeeklyMusicListenStats,
} = require('./weeklyTopMusicRead.service');
const { rankMusicListenStats } = require('../utils/musicListenStatsRanker');

/**
 * Read + same ranker adapter. Writes nothing. Oyna configdan, query oyna o‘zgartirmaydi.
 *
 * @param {{ now?: Date, limit?: number }} [opts]
 */
const getMonthlyTopMusicFromListenEvents = async (opts = {}) => {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const windowDays = monthlyTopMusicConfig.windowDays;

  const stats = await readWeeklyMusicListenStats({
    now,
    windowDays,
    contentType: monthlyTopMusicConfig.contentType,
  });

  const items = rankMusicListenStats(stats, {
    limit: opts.limit,
    minViews: monthlyTopMusicConfig.minViews,
    maxLimit: monthlyTopMusicConfig.topMaxLimit,
  });

  return {
    items,
    windowDays,
    limit: monthlyTopMusicConfig.topLimit,
    minViews: monthlyTopMusicConfig.minViews,
    contentType: monthlyTopMusicConfig.contentType,
    source: items.length ? 'monthly_top_music' : 'empty',
  };
};

module.exports = {
  getMonthlyTopMusicFromListenEvents,
};
