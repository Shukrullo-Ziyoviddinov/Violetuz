/**
 * Mix yig'ish. music_mixes ga yozilmaydi.
 * 3 martadan kam tashlanadi. Janr ichida ko'p tinglangan yuqorida, 25 tadan oshmaydi.
 *
 * @module music-mixes/services/mixEngine
 */

'use strict';

const { musicMixWeights } = require('../config/musicMixWeights');
const { listMixPlayCounts } = require('../repositories/playCount.repository');

/**
 * @param {{ playCount?: number, lastPlayedAt?: Date|string|null, contentId?: string }} a
 * @param {{ playCount?: number, lastPlayedAt?: Date|string|null, contentId?: string }} b
 * @returns {number}
 */
const byMostPlayed = (a, b) => {
  const countDiff = (Number(b.playCount) || 0) - (Number(a.playCount) || 0);
  if (countDiff !== 0) return countDiff;
  const aTime = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0;
  const bTime = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0;
  if (bTime !== aTime) return bTime - aTime;
  return String(a.contentId).localeCompare(String(b.contentId));
};

/**
 * @param {Array<{ contentId: string, genre: string, playCount: number, lastPlayedAt?: Date|null }>} rows
 * @returns {Array<{ genre: string, tracks: Array<{ contentId: string, genre: string, playCount: number, position: number }> }>}
 */
const assembleMixes = (rows) => {
  const minPlays = Math.max(1, Number(musicMixWeights.minPlays) || 3);
  const mixSize = Math.max(1, Number(musicMixWeights.mixSize) || 25);
  /** @type {Map<string, Object[]>} */
  const groups = new Map();

  for (const row of rows || []) {
    const playCount = Number(row.playCount) || 0;
    if (playCount < minPlays) continue;
    const genre = String(row.genre || '').trim();
    const contentId = String(row.contentId || '').trim();
    if (!genre || !contentId) continue;
    if (!groups.has(genre)) groups.set(genre, []);
    groups.get(genre).push({
      contentId,
      genre,
      playCount,
      lastPlayedAt: row.lastPlayedAt || null,
    });
  }

  /** @type {Array<{ genre: string, tracks: Object[] }>} */
  const mixes = [];
  for (const [genre, tracks] of groups) {
    tracks.sort(byMostPlayed);
    const kept = tracks.slice(0, mixSize);
    mixes.push({
      genre,
      tracks: kept.map((track, index) => ({
        contentId: track.contentId,
        genre,
        playCount: track.playCount,
        position: index + 1,
      })),
    });
  }

  mixes.sort((a, b) => byMostPlayed(a.tracks[0], b.tracks[0]) || a.genre.localeCompare(b.genre));
  return mixes;
};

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<ReturnType<typeof assembleMixes>>}
 */
const buildUserMixes = async (userId) => {
  const rows = await listMixPlayCounts(userId);
  return assembleMixes(rows);
};

module.exports = {
  assembleMixes,
  buildUserMixes,
};
