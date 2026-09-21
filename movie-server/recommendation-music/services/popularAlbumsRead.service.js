/**
 * Mashhur albomlar — faqat ListenEvent o‘qish.
 * Pipeline weekly moduldan (`readWeeklyMusicListenStats`), tartib musicListenStatsRanker.
 * Bu fayl faqat 30 kunlik oyna, contentType album va limit 20 beradi.
 * Progress, affinity, ContentView ga yozilmaydi.
 *
 * @module recommendation-music/services/popularAlbumsRead.service
 */

'use strict';

const { popularAlbumsConfig } = require('../config/popularAlbums.config');
const {
  readWeeklyMusicListenStats,
} = require('./weeklyTopMusicRead.service');
const { rankMusicListenStats } = require('../utils/musicListenStatsRanker');

/**
 * Read + same ranker adapter. Writes nothing. Oyna configdan, query oyna o‘zgartirmaydi.
 *
 * @param {{ now?: Date, limit?: number }} [opts]
 */
const getPopularAlbumsFromListenEvents = async (opts = {}) => {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const windowDays = popularAlbumsConfig.windowDays;

  const stats = await readWeeklyMusicListenStats({
    now,
    windowDays,
    contentType: popularAlbumsConfig.contentType,
  });

  const items = rankMusicListenStats(stats, {
    limit: opts.limit,
    minViews: popularAlbumsConfig.minViews,
    maxLimit: popularAlbumsConfig.topMaxLimit,
  });

  return {
    items,
    windowDays,
    limit: popularAlbumsConfig.topLimit,
    minViews: popularAlbumsConfig.minViews,
    contentType: popularAlbumsConfig.contentType,
    source: items.length ? 'popular_albums' : 'empty',
  };
};

module.exports = {
  getPopularAlbumsFromListenEvents,
};
