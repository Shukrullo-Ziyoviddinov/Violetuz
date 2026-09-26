/**
 * music_mix_play_counts. Bitta user va bitta qo'shiq — bitta qator.
 * Har marta playCount 1 ga oshadi. Yangi qator ochilmaydi.
 *
 * @module music-mixes/repositories/playCount.repository
 */

'use strict';

const { MusicMixPlayCount } = require('../models');
const { parseUserId } = require('./parseUserId');

/**
 * @param {Object} row
 * @param {boolean} sameSession
 */
const toPlayRow = (row, sameSession) => ({
  contentId: String(row.contentId),
  genre: String(row.genre),
  playCount: Number(row.playCount) || 0,
  lastPlayedAt: row.lastPlayedAt,
  sameSession,
});

/**
 * Bir sessiya bir marta. Boshqa sessiya shu qatorda playCount ni 1 ga oshiradi.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} contentId
 * @param {string} genre
 * @param {string} sessionId
 * @param {Date} [playedAt]
 * @returns {Promise<{ contentId: string, genre: string, playCount: number, lastPlayedAt: Date, sameSession: boolean }|null>}
 */
const incrementMixPlayCount = async (userId, contentId, genre, sessionId, playedAt = new Date()) => {
  const uid = parseUserId(userId);
  const id = String(contentId || '').trim();
  const mixGenre = String(genre || '').trim();
  const session = String(sessionId || '').trim();
  if (!uid || !id || !mixGenre || !session) return null;

  const updated = await MusicMixPlayCount.findOneAndUpdate(
    {
      userId: uid,
      contentId: id,
      lastSessionId: { $ne: session },
    },
    {
      $inc: { playCount: 1 },
      $set: {
        genre: mixGenre,
        lastPlayedAt: playedAt,
        lastSessionId: session,
      },
    },
    { returnDocument: 'after' }
  ).lean();
  if (updated) return toPlayRow(updated, false);

  const existing = await MusicMixPlayCount.findOne({ userId: uid, contentId: id }).lean();
  if (existing) return toPlayRow(existing, true);

  try {
    const created = await MusicMixPlayCount.create({
      userId: uid,
      contentId: id,
      genre: mixGenre,
      playCount: 1,
      lastPlayedAt: playedAt,
      lastSessionId: session,
    });
    return toPlayRow(created, false);
  } catch (err) {
    if (err?.code !== 11000) throw err;
    const raced = await MusicMixPlayCount.findOneAndUpdate(
      {
        userId: uid,
        contentId: id,
        lastSessionId: { $ne: session },
      },
      {
        $inc: { playCount: 1 },
        $set: {
          genre: mixGenre,
          lastPlayedAt: playedAt,
          lastSessionId: session,
        },
      },
      { returnDocument: 'after' }
    ).lean();
    if (raced) return toPlayRow(raced, false);
    const held = await MusicMixPlayCount.findOne({ userId: uid, contentId: id }).lean();
    return held ? toPlayRow(held, true) : null;
  }
};

/**
 * Foydalanuvchining barcha mix martalari. Yig'ish shu ro'yxatdan qilinadi.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<Array<{ contentId: string, genre: string, playCount: number, lastPlayedAt: Date|null }>>}
 */
const listMixPlayCounts = async (userId) => {
  const uid = parseUserId(userId);
  if (!uid) return [];

  const rows = await MusicMixPlayCount.find({ userId: uid })
    .select({
      contentId: 1,
      genre: 1,
      playCount: 1,
      lastPlayedAt: 1,
      _id: 0,
    })
    .lean();

  return (rows || []).map((row) => ({
    contentId: String(row.contentId || '').trim(),
    genre: String(row.genre || '').trim(),
    playCount: Number(row.playCount) || 0,
    lastPlayedAt: row.lastPlayedAt || null,
  }));
};

module.exports = {
  incrementMixPlayCount,
  listMixPlayCounts,
};
