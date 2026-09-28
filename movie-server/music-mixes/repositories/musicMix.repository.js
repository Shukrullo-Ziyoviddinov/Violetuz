/**
 * Tayyor mix. Collection: music_mixes
 * Sahifa hisoblamaydi, fon ishi shu yerga yozadi.
 *
 * @module music-mixes/repositories/musicMix.repository
 */

'use strict';

const crypto = require('crypto');
const { MusicMix } = require('../models');
const { normalizeMixContentType } = require('../contentType');
const { parseUserId } = require('./parseUserId');

/**
 * Yig'ilgan janr mixlarini almashtiradi.
 * Yangi to'plamda yo'q janr va 25 likdan chiqqan qo'shiq o'chadi.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {Array<{ genre: string, tracks: Array<{ contentId: string, position: number, playCount: number }> }>} mixes
 * @param {'music'|'klip'} [contentType]
 * @returns {Promise<{ written: number, batchId: string|null }>}
 */
const replaceUserMixes = async (userId, mixes, contentType = 'music') => {
  const uid = parseUserId(userId);
  const type = normalizeMixContentType(contentType);
  if (!uid) return { written: 0, batchId: null };

  const items = [];
  for (const mix of mixes || []) {
    const genre = String(mix.genre || '').trim();
    if (!genre) continue;
    for (const track of mix.tracks || []) {
      const contentId = String(track.contentId || '').trim();
      if (!contentId) continue;
      items.push({
        genre,
        contentId,
        position: Number(track.position) || 0,
        playCount: Number(track.playCount) || 0,
      });
    }
  }

  if (!items.length) {
    await MusicMix.deleteMany({ userId: uid, contentType: type });
    if (type === 'music') {
      await MusicMix.deleteMany({ userId: uid, contentType: { $exists: false } });
    }
    return { written: 0, batchId: null };
  }

  const now = new Date();
  const batchId = crypto.randomBytes(12).toString('hex');
  const ops = items.map((item) => ({
    updateOne: {
      filter: {
        userId: uid,
        contentType: type,
        genre: item.genre,
        contentId: item.contentId,
      },
      // contentType/genre/contentId faqat filterda — $set va $setOnInsert da
      // birga qo'yilsa MongoDB conflict beradi, butun yozuv yiqiladi.
      update: {
        $set: {
          position: item.position,
          playCount: item.playCount,
          generatedAt: now,
          batchId,
        },
      },
      upsert: true,
    },
  }));

  await MusicMix.bulkWrite(ops, { ordered: false });
  await MusicMix.deleteMany({
    userId: uid,
    contentType: type,
    batchId: { $ne: batchId },
  });
  if (type === 'music') {
    await MusicMix.deleteMany({ userId: uid, contentType: { $exists: false } });
  }

  return { written: items.length, batchId };
};

module.exports = {
  replaceUserMixes,
};
