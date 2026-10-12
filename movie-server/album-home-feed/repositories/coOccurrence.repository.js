/**
 * album_home_feed_co_occurrence o'qishi va yozuvi.
 * music_home_feed_co_occurrence, tinglash hodisasi va bo'lim jadvallariga yozilmaydi.
 *
 * @module album-home-feed/repositories/coOccurrence.repository
 */

'use strict';

const crypto = require('crypto');
const { AlbumCoOccurrence } = require('../models');

/**
 * @param {string[]} seedIds
 * @param {number} [limit]
 * @returns {Promise<Array<{ contentId: string, coListenCount: number }>>}
 */
const listCoOccurredAlbums = async (seedIds, limit = 40) => {
  const seeds = [...new Set((seedIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  if (!seeds.length) return [];

  const rows = await AlbumCoOccurrence.find({ contentIdA: { $in: seeds } })
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
 * Butun albom juftlik jadvalini almashtiradi.
 *
 * @param {Array<{ contentIdA: string, contentIdB: string, coListenCount: number }>} pairs
 * @returns {Promise<{ written: number }>}
 */
const replaceAlbumCoOccurrence = async (pairs) => {
  const items = Array.isArray(pairs) ? pairs : [];
  if (!items.length) {
    await AlbumCoOccurrence.deleteMany({});
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

  await AlbumCoOccurrence.bulkWrite(ops, { ordered: false });
  await AlbumCoOccurrence.deleteMany({ batchId: { $ne: batchId } });
  return { written: items.length };
};

module.exports = {
  listCoOccurredAlbums,
  replaceAlbumCoOccurrence,
};
