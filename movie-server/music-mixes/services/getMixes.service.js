/**
 * Tayyor mixni o'qish. Yig'ish va fon ishi chaqirilmaydi.
 *
 * @module music-mixes/services/getMixes.service
 */

'use strict';

const { MusicMix } = require('../models');
const { parseUserId } = require('../repositories/parseUserId');

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<Array<{ genre: string, tracks: Array<{ contentId: string, genre: string, position: number, playCount: number }> }>>}
 */
const listReadyMixes = async (userId) => {
  const uid = parseUserId(userId);
  if (!uid) return [];

  const rows = await MusicMix.find({ userId: uid })
    .select({
      genre: 1,
      contentId: 1,
      position: 1,
      playCount: 1,
      _id: 0,
    })
    .sort({ position: 1 })
    .lean();

  /** @type {Map<string, { genre: string, tracks: Object[] }>} */
  const groups = new Map();
  for (const row of rows || []) {
    const genre = String(row.genre || '').trim();
    const contentId = String(row.contentId || '').trim();
    if (!genre || !contentId) continue;
    if (!groups.has(genre)) groups.set(genre, { genre, tracks: [] });
    groups.get(genre).tracks.push({
      contentId,
      genre,
      position: Number(row.position) || 0,
      playCount: Number(row.playCount) || 0,
    });
  }

  const mixes = [...groups.values()];
  for (const mix of mixes) {
    mix.tracks.sort((a, b) => a.position - b.position || a.contentId.localeCompare(b.contentId));
  }
  mixes.sort((a, b) => {
    const countDiff = (b.tracks[0]?.playCount || 0) - (a.tracks[0]?.playCount || 0);
    if (countDiff !== 0) return countDiff;
    return a.genre.localeCompare(b.genre);
  });
  return mixes;
};

module.exports = {
  listReadyMixes,
};
