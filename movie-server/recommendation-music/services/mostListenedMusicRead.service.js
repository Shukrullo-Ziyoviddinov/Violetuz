/**
 * Hozir trendda — faqat ListenEvent o‘qish.
 * Pipeline weekly moduldan (`readWeeklyMusicListenStats`), tartib musicListenStatsRanker.
 * Bu fayl faqat 7 kunlik suriluvchi oyna, contentType music va limit 20 beradi.
 * Progress, affinity, ContentView ga yozilmaydi. Tinglov yozuvi o‘chirilmaydi.
 * Katalogda yo‘q (o‘chirilgan) contentId lar rankga kirmaydi.
 *
 * @module recommendation-music/services/mostListenedMusicRead.service
 */

'use strict';

const Music = require('../../models/Music.model');
const { mostListenedMusicConfig } = require('../config/mostListenedMusic.config');
const {
  readWeeklyMusicListenStats,
} = require('./weeklyTopMusicRead.service');
const { rankMusicListenStats } = require('../utils/musicListenStatsRanker');

/**
 * @param {Array<{ contentId?: unknown }>} stats
 * @returns {Promise<Array<{ contentId?: unknown }>>}
 */
const keepStatsWithLiveMusic = async (stats) => {
  const rows = Array.isArray(stats) ? stats : [];
  if (rows.length === 0) return [];

  const idNums = [];
  const seen = new Set();
  for (const row of rows) {
    const n = Number(row?.contentId);
    if (!Number.isFinite(n) || seen.has(n)) continue;
    seen.add(n);
    idNums.push(n);
  }
  if (idNums.length === 0) return [];

  const docs = await Music.find({ id: { $in: idNums } })
    .select({ id: 1, _id: 0 })
    .lean();
  const live = new Set((docs || []).map((d) => String(d.id)));

  return rows.filter((row) => live.has(String(row?.contentId ?? '')));
};

/**
 * Read + same ranker adapter. Writes nothing. Oyna configdan, query oyna o‘zgartirmaydi.
 *
 * @param {{ now?: Date, limit?: number }} [opts]
 */
const getMostListenedMusicFromListenEvents = async (opts = {}) => {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const windowDays = mostListenedMusicConfig.windowDays;
  const requested = Number(opts.limit);
  const limit =
    Number.isFinite(requested) && requested > 0
      ? requested
      : mostListenedMusicConfig.topLimit;

  const stats = await readWeeklyMusicListenStats({
    now,
    windowDays,
    contentType: mostListenedMusicConfig.contentType,
  });

  const liveStats = await keepStatsWithLiveMusic(stats);

  const items = rankMusicListenStats(liveStats, {
    limit,
    minViews: mostListenedMusicConfig.minViews,
    maxLimit: mostListenedMusicConfig.topMaxLimit,
  });

  return {
    items,
    windowDays,
    limit: mostListenedMusicConfig.topLimit,
    minViews: mostListenedMusicConfig.minViews,
    contentType: mostListenedMusicConfig.contentType,
    source: items.length ? 'most_listened_music' : 'empty',
  };
};

module.exports = {
  getMostListenedMusicFromListenEvents,
  keepStatsWithLiveMusic,
};
