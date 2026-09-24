/**
 * Shaxsiy manba. Har bir musiqa bo'limidagi tayyor tavsiya cache.
 * Boshqa manbalarni chaqirmaydi. Faqat qo'shiq.
 *
 * @module music-home-feed/sources/personal.source
 */

'use strict';

const { listPersonalCandidates } = require('../repositories/sectionRecommendations.read');

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<Array<{ contentId: string, category: string, sourceType: 'personal', rawScore: number }>>}
 */
const listPersonalSource = async (userId) => {
  const rows = await listPersonalCandidates(userId);
  return rows.map((row) => ({
    contentId: row.contentId,
    category: row.category,
    sourceType: 'personal',
    rawScore: row.score,
  }));
};

module.exports = {
  listPersonalSource,
};
