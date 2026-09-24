/**
 * Trend manba. Faqat musiqa trend jadvali.
 * Boshqa manbalarni chaqirmaydi. Ball bo'lim ichida qoladi.
 *
 * @module music-home-feed/sources/trending.source
 */

'use strict';

const { listTrendingCandidates } = require('../repositories/trending.read');

/**
 * @returns {Promise<Array<{ contentId: string, category: string, sourceType: 'trending', rawScore: number }>>}
 */
const listTrendingSource = async () => {
  const rows = await listTrendingCandidates();
  return rows.map((row) => ({
    contentId: row.contentId,
    category: row.category,
    sourceType: 'trending',
    rawScore: row.trendingScore,
  }));
};

module.exports = {
  listTrendingSource,
};
