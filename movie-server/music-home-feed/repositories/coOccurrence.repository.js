/**
 * music_home_feed_co_occurrence yozuvi va o'qishi.
 * Tinglash hodisasi va bo'lim jadvallariga yozilmaydi.
 *
 * @module music-home-feed/repositories/coOccurrence.repository
 */

'use strict';

const crypto = require('crypto');
const { MusicCoOccurrence } = require('../models');

/**
 * @param {string[]} seedIds
 * @param {number} [limit]
 * @returns {Promise<Array<{ contentId: string, coListenCount: number }>>}
 */
const listCoOccurredTracks = async (seedIds, limit = 40) => {
  const seeds = [...new Set((seedIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  if (!seeds.length) return [];

  const rows = await MusicCoOccurrence.find({ contentIdA: { $in: seeds } })
    .select({ contentIdB: 1, coListenCount: 1, _id: 0 })
    .sort({ coListenCount: -1 })
    .limit(Math.max(1, limit))
    .lean();

  return (rows || []).map((row) => ({
    contentId: String(row.contentIdB || '').trim(),
    coListenCount: Number(row.coListenCount) || 0,
  })).filter((row) => row.contentId);
};

/**
 * Butun juftlik jadvalini almashtiradi.
 *
 * @param {Array<{ contentIdA: string, contentIdB: string, coListenCount: number }>} pairs
 * @returns {Promise<{ written: number }>}
 */
const replaceCoOccurrence = async (pairs) => {
  const items = Array.isArray(pairs) ? pairs : [];
  if (!items.length) {
    await MusicCoOccurrence.deleteMany({});
    return { written: 0 };
  }

  const now = new Date();
  const batchId = crypto.randomBytes(12).toString('hex');
  const ops = items.map((item) => ({
    updateOne: {
      filter: {
        contentIdA: String(item.contentIdA),
        contentIdB: String(item.contentIdB),
      },
      update: {
        $set: {
          coListenCount: item.coListenCount,
          updatedAt: now,
          batchId,
        },
        $setOnInsert: {
          contentIdA: String(item.contentIdA),
          contentIdB: String(item.contentIdB),
        },
      },
      upsert: true,
    },
  }));

  await MusicCoOccurrence.bulkWrite(ops, { ordered: false });
  await MusicCoOccurrence.deleteMany({ batchId: { $ne: batchId } });
  return { written: items.length };
};

module.exports = {
  listCoOccurredTracks,
  replaceCoOccurrence,
};
