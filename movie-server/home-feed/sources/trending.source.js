/**
 * Trend manba. Faqat bo'lim trend jadvali.
 * Boshqa manbalarni chaqirmaydi. Ball bo'lim ichida qoladi.
 *
 * @module home-feed/sources/trending.source
 */

'use strict';

const { listTrendingCandidates } = require('../repositories/trending.read');

/**
 * @returns {Promise<Array<{ movieId: string, category: string, sourceType: 'trending', rawScore: number }>>}
 */
const listTrendingSource = async () => {
  const rows = await listTrendingCandidates();
  return rows.map((row) => ({
    movieId: row.movieId,
    category: row.category,
    sourceType: 'trending',
    rawScore: row.trendingScore,
  }));
};

module.exports = {
  listTrendingSource,
};
