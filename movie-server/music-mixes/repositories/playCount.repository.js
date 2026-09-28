/**
 * music_mix_play_counts. Bitta user, bitta tur va bitta kontent — bitta qator.
 * Har marta playCount 1 ga oshadi. Yangi qator ochilmaydi.
 *
 * @module music-mixes/repositories/playCount.repository
 */

'use strict';

const { MusicMixPlayCount } = require('../models');
const { normalizeMixContentType } = require('../contentType');
const { parseUserId } = require('./parseUserId');

/**
 * @param {Object} row
 * @param {boolean} sameSession
 */
const toPlayRow = (row, sameSession) => ({
  contentType: normalizeMixContentType(row.contentType),
  contentId: String(row.contentId),
  genre: String(row.genre),
  playCount: Number(row.playCount) || 0,
  lastPlayedAt: row.lastPlayedAt,
  sameSession,
});

const legacyMusicFilter = (userId, contentId) => ({
  userId,
  contentId,
  contentType: { $exists: false },
});

/**
 * Bir sessiya bir marta. Boshqa sessiya shu qatorda playCount ni 1 ga oshiradi.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} contentId
 * @param {string} genre
 * @param {string} sessionId
 * @param {Date} [playedAt]
 * @param {'music'|'klip'} [contentType]
 * @returns {Promise<{ contentType: string, contentId: string, genre: string, playCount: number, lastPlayedAt: Date, sameSession: boolean }|null>}
 */
const incrementMixPlayCount = async (
  userId,
  contentId,
  genre,
  sessionId,
  playedAt = new Date(),
  contentType = 'music'
) => {
  const uid = parseUserId(userId);
  const id = String(contentId || '').trim();
  const mixGenre = String(genre || '').trim();
  const session = String(sessionId || '').trim();
  const type = normalizeMixContentType(contentType);
  if (!uid || !id || !mixGenre || !session) return null;

  const identity = { userId: uid, contentType: type, contentId: id };
  const stamp = {
    contentType: type,
    genre: mixGenre,
    lastPlayedAt: playedAt,
    lastSessionId: session,
  };

  const updated = await MusicMixPlayCount.findOneAndUpdate(
    { ...identity, lastSessionId: { $ne: session } },
    { $inc: { playCount: 1 }, $set: stamp },
    { returnDocument: 'after' }
  ).lean();
  if (updated) return toPlayRow(updated, false);

  if (type === 'music') {
    const legacy = await MusicMixPlayCount.findOneAndUpdate(
      { ...legacyMusicFilter(uid, id), lastSessionId: { $ne: session } },
      { $inc: { playCount: 1 }, $set: stamp },
      { returnDocument: 'after' }
    ).lean();
    if (legacy) return toPlayRow(legacy, false);
  }

  const existing = await MusicMixPlayCount.findOne(identity).lean();
  if (existing) return toPlayRow(existing, true);
  if (type === 'music') {
    const old = await MusicMixPlayCount.findOne(legacyMusicFilter(uid, id)).lean();
    if (old) return toPlayRow(old, true);
  }

  try {
    const created = await MusicMixPlayCount.create({
      ...identity,
      genre: mixGenre,
      playCount: 1,
      lastPlayedAt: playedAt,
      lastSessionId: session,
    });
    return toPlayRow(created, false);
  } catch (err) {
    if (err?.code !== 11000) throw err;
    const raced = await MusicMixPlayCount.findOneAndUpdate(
      { ...identity, lastSessionId: { $ne: session } },
      { $inc: { playCount: 1 }, $set: stamp },
      { returnDocument: 'after' }
    ).lean();
    if (raced) return toPlayRow(raced, false);
    const held = await MusicMixPlayCount.findOne(identity).lean();
    return held ? toPlayRow(held, true) : null;
  }
};

/**
 * Foydalanuvchining barcha mix martalari. Yig'ish shu ro'yxatdan qilinadi.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {'music'|'klip'} [contentType]
 * @returns {Promise<Array<{ contentType: string, contentId: string, genre: string, playCount: number, lastPlayedAt: Date|null }>>}
 */
const listMixPlayCounts = async (userId, contentType = 'music') => {
  const uid = parseUserId(userId);
  if (!uid) return [];
  const type = normalizeMixContentType(contentType);
  const typeFilter = type === 'music'
    ? { $or: [{ contentType: 'music' }, { contentType: { $exists: false } }] }
    : { contentType: type };

  const rows = await MusicMixPlayCount.find({ userId: uid, ...typeFilter })
    .select({
      contentType: 1,
      contentId: 1,
      genre: 1,
      playCount: 1,
      lastPlayedAt: 1,
      _id: 0,
    })
    .lean();

  return (rows || []).map((row) => ({
    contentType: normalizeMixContentType(row.contentType || type),
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
