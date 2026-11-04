/**
 * Beshinchi manba: birga ko'rilgan kinolar.
 * Jadval bo'sh bo'lsa bo'sh ro'yxat. Boshqa manbalarni chaqirmaydi.
 *
 * @module home-feed/sources/collaborative.source
 */

'use strict';

const { homeFeedWeights } = require('../config/homeFeedWeights');
const { listWatchProgress } = require('../repositories/watchProgress.read');
const { listCoOccurredMovies } = require('../repositories/coOccurrence.repository');

/**
 * @param {string[]} seedIds
 * @returns {Promise<Array<{ movieId: string, category: string, sourceType: 'collaborative', rawScore: number }>>}
 */
const listCollaborativeFromSeeds = async (seedIds, allowedMovieIds) => {
  const seeds = [...new Set((seedIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  const limit = homeFeedWeights.candidateLimits.collaborative;
  const allow = allowedMovieIds instanceof Set ? allowedMovieIds : null;
  if (!seeds.length || (allow && !allow.size)) return [];

  const seedSet = new Set(seeds);
  const fetchLimit = allow
    ? Math.min(400, Math.max(limit * 3, allow.size, limit))
    : Math.max(limit * 3, limit);
  const rows = await listCoOccurredMovies(seeds, fetchLimit);
  /** @type {Map<string, number>} */
  const best = new Map();

  for (const row of rows) {
    if (!row.movieId || seedSet.has(row.movieId)) continue;
    if (allow && !allow.has(row.movieId)) continue;
    const prev = best.get(row.movieId) || 0;
    if (row.coWatchCount > prev) best.set(row.movieId, row.coWatchCount);
  }

  return [...best.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, Math.max(1, limit))
    .map(([movieId, coWatchCount]) => ({
      movieId,
      category: '',
      sourceType: 'collaborative',
      rawScore: coWatchCount,
    }));
};

/**
 * Login: so'nggi ko'rilgan kinolardan juftlik.
 *
 * @param {string|import('mongoose').Types.ObjectId|null} userId
 */
const listCollaborativeSource = async (userId, allowedMovieIds) => {
  const progress = await listWatchProgress(userId);
  const take = homeFeedWeights.coOccurrence.recentSeedMovies;
  const seeds = progress
    .filter((row) => row.watched)
    .slice(0, Math.max(1, take))
    .map((row) => row.movieId);
  return listCollaborativeFromSeeds(seeds, allowedMovieIds);
};

module.exports = {
  listCollaborativeFromSeeds,
  listCollaborativeSource,
};
