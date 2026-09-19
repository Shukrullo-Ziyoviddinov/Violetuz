/**
 * Hafta + oy top musiqalari — bitta HTTP javob.
 * Hisoblash alohida service larda; bu faqat parallel compose.
 *
 * @module recommendation-music/services/topMusicChartsRead.service
 */

'use strict';

const {
  getWeeklyTopMusicFromListenEvents,
} = require('./weeklyTopMusicRead.service');
const {
  getMonthlyTopMusicFromListenEvents,
} = require('./monthlyTopMusicRead.service');

/**
 * @param {{ now?: Date, limit?: number }} [opts]
 */
const getTopMusicChartsFromListenEvents = async (opts = {}) => {
  const [weekly, monthly] = await Promise.all([
    getWeeklyTopMusicFromListenEvents(opts),
    getMonthlyTopMusicFromListenEvents(opts),
  ]);

  return {
    weekly,
    monthly,
    source:
      weekly.items?.length || monthly.items?.length
        ? 'top_music_charts'
        : 'empty',
  };
};

module.exports = {
  getTopMusicChartsFromListenEvents,
};
