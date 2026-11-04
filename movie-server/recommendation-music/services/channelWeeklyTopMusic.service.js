/**
 * Kanal sahifasidagi haftaning top musiqalari.
 * Eshitish va tartib umumiy weekly moduldan. Bu fayl faqat shu kanal qo‘shiqlarini qoldiradi.
 * Eshitish kanal ichidagi alohida hisob emas — qo‘shiq qayerda ochilgan bo‘lsa, o‘sha yozuv.
 *
 * @module recommendation-music/services/channelWeeklyTopMusic.service
 */

'use strict';

const Music = require('../../models/Music.model');
const { weeklyTopMusicConfig } = require('../config/weeklyTopMusic.config');
const { readWeeklyMusicListenStats } = require('./weeklyTopMusicRead.service');
const { rankMusicListenStats } = require('../utils/musicListenStatsRanker');
const { parseContentKey } = require('../utils/contentKey');

/**
 * @param {unknown} row
 * @returns {string}
 */
const trackIdOf = (row) => {
  const direct = String(row?.contentId ?? '').trim();
  if (direct) return direct;
  const parsed = parseContentKey(row?.contentKey);
  if (parsed?.contentType !== 'music') return '';
  return parsed.contentId;
};

/**
 * @param {Array<{ contentId?: unknown, contentKey?: unknown }>} stats
 * @param {string} channelId
 */
const keepChannelMusicStats = async (stats, channelId) => {
  const rows = Array.isArray(stats) ? stats : [];
  const channel = String(channelId || '').trim();
  if (!channel || rows.length === 0) return [];

  const idNums = [];
  const seen = new Set();
  for (const row of rows) {
    const n = Number(trackIdOf(row));
    if (!Number.isFinite(n) || seen.has(n)) continue;
    seen.add(n);
    idNums.push(n);
  }
  if (idNums.length === 0) return [];

  const docs = await Music.find({ id: { $in: idNums }, channelId: channel })
    .select({ id: 1, _id: 0 })
    .lean();
  const live = new Set((docs || []).map((doc) => String(doc.id)));

  return rows.filter((row) => live.has(trackIdOf(row)));
};

/**
 * @param {{ now?: Date, channelId?: string }} [opts]
 */
const getChannelWeeklyTopMusic = async (opts = {}) => {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const channelId = String(opts.channelId || '').trim();
  const stats = await readWeeklyMusicListenStats({ now });
  const channelStats = await keepChannelMusicStats(stats, channelId);
  const items = rankMusicListenStats(channelStats);

  return {
    items,
    channelId,
    windowDays: weeklyTopMusicConfig.weeklyWindowDays,
    limit: weeklyTopMusicConfig.topLimit,
    minViews: weeklyTopMusicConfig.minViews,
    contentType: weeklyTopMusicConfig.contentType,
    source: items.length ? 'channel_weekly_top_music' : 'empty',
  };
};

module.exports = {
  getChannelWeeklyTopMusic,
};
