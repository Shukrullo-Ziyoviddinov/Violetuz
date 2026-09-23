/**
 * home_feed_movie_co_occurrence yozuvi va o'qishi.
 * watch_events va bo'lim jadvallariga yozilmaydi.
 *
 * @module home-feed/repositories/coOccurrence.repository
 */

'use strict';

const crypto = require('crypto');
const { MovieCoOccurrence } = require('../models');

/**
 * @param {string[]} seedIds
 * @param {number} [limit]
 * @returns {Promise<Array<{ movieId: string, coWatchCount: number }>>}
 */
const listCoOccurredMovies = async (seedIds, limit = 40) => {
  const seeds = [...new Set((seedIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  if (!seeds.length) return [];

  const rows = await MovieCoOccurrence.find({ movieIdA: { $in: seeds } })
    .select({ movieIdB: 1, coWatchCount: 1, _id: 0 })
    .sort({ coWatchCount: -1 })
    .limit(Math.max(1, limit))
    .lean();

  return (rows || []).map((row) => ({
    movieId: String(row.movieIdB || '').trim(),
    coWatchCount: Number(row.coWatchCount) || 0,
  })).filter((row) => row.movieId);
};

/**
 * Butun juftlik jadvalini almashtiradi.
 *
 * @param {Array<{ movieIdA: string, movieIdB: string, coWatchCount: number }>} pairs
 * @returns {Promise<{ written: number }>}
 */
const replaceCoOccurrence = async (pairs) => {
  const items = Array.isArray(pairs) ? pairs : [];
  if (!items.length) {
    await MovieCoOccurrence.deleteMany({});
    return { written: 0 };
  }

  const now = new Date();
  const batchId = crypto.randomBytes(12).toString('hex');
  const ops = items.map((item) => ({
    updateOne: {
      filter: {
        movieIdA: String(item.movieIdA),
        movieIdB: String(item.movieIdB),
      },
      update: {
        $set: {
          coWatchCount: item.coWatchCount,
          updatedAt: now,
          batchId,
        },
        $setOnInsert: {
          movieIdA: String(item.movieIdA),
          movieIdB: String(item.movieIdB),
        },
      },
      upsert: true,
    },
  }));

  await MovieCoOccurrence.bulkWrite(ops, { ordered: false });
  await MovieCoOccurrence.deleteMany({ batchId: { $ne: batchId } });
  return { written: items.length };
};

module.exports = {
  listCoOccurredMovies,
  replaceCoOccurrence,
};
