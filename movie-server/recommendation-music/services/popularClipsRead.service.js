/**
 * Mashhur kliplar — faqat ListenEvent o‘qish.
 * Pipeline weekly moduldan (`readWeeklyMusicListenStats`), tartib musicListenStatsRanker.
 * Bu fayl faqat 30 kunlik oyna, contentType clip va limit 20 beradi.
 * Progress, affinity, ContentView ga yozilmaydi.
 * Katalogda yo‘q (o‘chirilgan) contentId lar rankga kirmaydi — UI da “o‘lik id” qolmasin.
 *
 * @module recommendation-music/services/popularClipsRead.service
 */

'use strict';

const Clip = require('../../models/Clip.model');
const { popularClipsConfig } = require('../config/popularClips.config');
const {
  readWeeklyMusicListenStats,
} = require('./weeklyTopMusicRead.service');
const { rankMusicListenStats } = require('../utils/musicListenStatsRanker');

/**
 * @param {Array<{ contentId?: unknown }>} stats
 * @returns {Promise<Array<{ contentId?: unknown }>>}
 */
const keepStatsWithLiveClips = async (stats) => {
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

  const docs = await Clip.find({ id: { $in: idNums } })
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
const getPopularClipsFromListenEvents = async (opts = {}) => {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const windowDays = popularClipsConfig.windowDays;

  const stats = await readWeeklyMusicListenStats({
    now,
    windowDays,
    contentType: popularClipsConfig.contentType,
  });

  const liveStats = await keepStatsWithLiveClips(stats);

  const items = rankMusicListenStats(liveStats, {
    limit: opts.limit,
    minViews: popularClipsConfig.minViews,
    maxLimit: popularClipsConfig.topMaxLimit,
  });

  return {
    items,
    windowDays,
    limit: popularClipsConfig.topLimit,
    minViews: popularClipsConfig.minViews,
    contentType: popularClipsConfig.contentType,
    source: items.length ? 'popular_clips' : 'empty',
  };
};

module.exports = {
  getPopularClipsFromListenEvents,
  keepStatsWithLiveClips,
};
