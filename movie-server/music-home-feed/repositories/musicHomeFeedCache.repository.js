/**
 * music_home_feed_cache yozuvi va o'qishi.
 * Kino home_feed_cache va musiqa bo'lim tavsiya jadvaliga tegmaydi.
 *
 * @module music-home-feed/repositories/musicHomeFeedCache.repository
 */

'use strict';

const crypto = require('crypto');
const { MusicHomeFeedCache } = require('../models');
const { parseUserId } = require('./parseUserId');

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<Array<{ contentId: string, position: number, score: number, sourceType: string, generatedAt: Date|null }>>}
 */
const listMusicHomeFeedCache = async (userId) => {
  const uid = parseUserId(userId);
  if (!uid) return [];

  const rows = await MusicHomeFeedCache.find({ userId: uid })
    .select({
      contentId: 1,
      position: 1,
      score: 1,
      sourceType: 1,
      generatedAt: 1,
      _id: 0,
    })
    .sort({ position: 1 })
    .lean();

  return (rows || []).map((row) => ({
    contentId: String(row.contentId),
    position: Number(row.position) || 0,
    score: Number(row.score) || 0,
    sourceType: row.sourceType,
    generatedAt: row.generatedAt || null,
  }));
};

/**
 * Foydalanuvchining musiqa lentasini to'liq almashtiradi.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {Array<{ contentId: string, position: number, score: number, sourceType: string }>} tracks
 * @returns {Promise<{ written: number, batchId: string|null }>}
 */
const replaceMusicHomeFeedCache = async (userId, tracks) => {
  const uid = parseUserId(userId);
  if (!uid) return { written: 0, batchId: null };

  const items = Array.isArray(tracks) ? tracks : [];
  if (!items.length) {
    await MusicHomeFeedCache.deleteMany({ userId: uid });
    return { written: 0, batchId: null };
  }

  const now = new Date();
  const batchId = crypto.randomBytes(12).toString('hex');
  const ops = items.map((item) => ({
    updateOne: {
      filter: {
        userId: uid,
        contentId: String(item.contentId),
      },
      update: {
        $set: {
          position: item.position,
          score: item.score,
          sourceType: item.sourceType,
          generatedAt: now,
          batchId,
        },
        $setOnInsert: {
          userId: uid,
          contentId: String(item.contentId),
        },
      },
      upsert: true,
    },
  }));

  await MusicHomeFeedCache.bulkWrite(ops, { ordered: false });
  await MusicHomeFeedCache.deleteMany({
    userId: uid,
    batchId: { $ne: batchId },
  });

  return { written: items.length, batchId };
};

module.exports = {
  listMusicHomeFeedCache,
  replaceMusicHomeFeedCache,
};
