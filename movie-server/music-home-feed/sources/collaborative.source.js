/**
 * Beshinchi manba: birga eshitilgan qo'shiqlar.
 * Jadval bo'sh bo'lsa bo'sh ro'yxat. Boshqa manbalarni chaqirmaydi.
 *
 * @module music-home-feed/sources/collaborative.source
 */

'use strict';

const { musicHomeFeedWeights } = require('../config/musicHomeFeedWeights');
const { listListenProgress } = require('../repositories/listenProgress.read');
const { listCoOccurredTracks } = require('../repositories/coOccurrence.repository');

/**
 * @param {string[]} seedIds
 * @returns {Promise<Array<{ contentId: string, category: string, sourceType: 'collaborative', rawScore: number }>>}
 */
const listCollaborativeFromSeeds = async (seedIds) => {
  const seeds = [...new Set((seedIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  const limit = musicHomeFeedWeights.candidateLimits.collaborative;
  if (!seeds.length) return [];

  const seedSet = new Set(seeds);
  const rows = await listCoOccurredTracks(seeds, Math.max(limit * 3, limit));
  /** @type {Map<string, number>} */
  const best = new Map();

  for (const row of rows) {
    if (!row.contentId || seedSet.has(row.contentId)) continue;
    const prev = best.get(row.contentId) || 0;
    if (row.coListenCount > prev) best.set(row.contentId, row.coListenCount);
  }

  return [...best.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, Math.max(1, limit))
    .map(([contentId, coListenCount]) => ({
      contentId,
      category: '',
      sourceType: 'collaborative',
      rawScore: coListenCount,
    }));
};

/**
 * Login: so'nggi tinglangan qo'shiqlardan juftlik.
 *
 * @param {string|import('mongoose').Types.ObjectId|null} userId
 */
const listCollaborativeSource = async (userId) => {
  const progress = await listListenProgress(userId);
  const take = musicHomeFeedWeights.coOccurrence.recentSeedTracks;
  const seeds = progress
    .filter((row) => row.listened)
    .slice(0, Math.max(1, take))
    .map((row) => row.contentId);
  return listCollaborativeFromSeeds(seeds);
};

module.exports = {
  listCollaborativeFromSeeds,
  listCollaborativeSource,
};
