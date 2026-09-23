/**
 * Shaxsiy manba. Faqat tayyor bo'lim tavsiya cache.
 * Boshqa manbalarni chaqirmaydi.
 *
 * @module home-feed/sources/personal.source
 */

'use strict';

const { listPersonalCandidates } = require('../repositories/sectionRecommendations.read');

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<Array<{ movieId: string, category: string, sourceType: 'personal', rawScore: number }>>}
 */
const listPersonalSource = async (userId) => {
  const rows = await listPersonalCandidates(userId);
  return rows.map((row) => ({
    movieId: row.movieId,
    category: row.category,
    sourceType: 'personal',
    rawScore: row.score,
  }));
};

module.exports = {
  listPersonalSource,
};
