/**
 * ListenEvent persistence.
 *
 * @module recommendation-music/repositories/listenEvent.repository
 */

'use strict';

const { ListenEvent } = require('../models');

const createListenEvent = async (payload) => {
  const doc = await ListenEvent.create({
    userId: payload.userId,
    contentKey: String(payload.contentKey),
    contentType: String(payload.contentType).trim(),
    contentId: String(payload.contentId).trim(),
    category: String(payload.category).trim(),
    completionRate: payload.completionRate ?? 0,
    listenedSeconds: Math.max(0, Number(payload.listenedSeconds) || 0),
    liked: Boolean(payload.liked),
    listenedAt: payload.listenedAt || new Date(),
    dimensionSnapshot: payload.dimensionSnapshot || null,
  });
  return doc.toObject();
};

const countPriorListens = async (userId, contentKey, excludeId) => {
  const filter = {
    userId,
    contentKey: String(contentKey),
  };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  return ListenEvent.countDocuments(filter);
};

const findListenEventById = async (id) => ListenEvent.findById(id).lean();

/**
 * Decay-weighted listen stats by category × contentType × contentId.
 *
 * @param {Object} [opts]
 * @returns {Promise<Array<{ category: string, contentType: string, contentId: string, viewCountRecent: number, likeCount: number, completionRateAvg: number }>>}
 */
const aggregateListenStatsByCategory = async (opts = {}) => {
  const nowMs =
    opts.now instanceof Date
      ? opts.now.getTime()
      : typeof opts.now === 'number'
        ? opts.now
        : Date.now();
  const now = new Date(nowMs);
  const since =
    opts.since instanceof Date
      ? opts.since
      : typeof opts.since === 'number'
        ? new Date(opts.since)
        : new Date(nowMs - 30 * 86_400_000);
  const halfLifeDays = Math.max(1, Number(opts.halfLifeDays) || 15);
  const msPerDay = 86_400_000;

  return ListenEvent.aggregate([
    {
      $match: {
        listenedAt: { $gte: since, $lte: now },
      },
    },
    {
      $addFields: {
        weight: {
          $pow: [
            0.5,
            {
              $divide: [
                {
                  $divide: [{ $subtract: [now, '$listenedAt'] }, msPerDay],
                },
                halfLifeDays,
              ],
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: {
          category: '$category',
          contentType: '$contentType',
          contentId: '$contentId',
        },
        viewCountRecent: { $sum: '$weight' },
        likeCount: {
          $sum: {
            $cond: [{ $eq: ['$liked', true] }, '$weight', 0],
          },
        },
        completionWeightSum: {
          $sum: { $multiply: ['$completionRate', '$weight'] },
        },
        weightSum: { $sum: '$weight' },
      },
    },
    {
      $project: {
        _id: 0,
        category: '$_id.category',
        contentType: '$_id.contentType',
        contentId: '$_id.contentId',
        viewCountRecent: 1,
        likeCount: 1,
        completionRateAvg: {
          $cond: [
            { $gt: ['$weightSum', 0] },
            { $divide: ['$completionWeightSum', '$weightSum'] },
            0,
          ],
        },
      },
    },
  ]);
};

/**
 * Decay-weighted average listenedSeconds by category × type × id.
 *
 * @param {Object} [opts]
 * @returns {Promise<Map<string, number>>} key = category\\0contentType\\0contentId
 */
const averageListenedSecondsByCategory = async (opts = {}) => {
  const nowMs =
    opts.now instanceof Date
      ? opts.now.getTime()
      : typeof opts.now === 'number'
        ? opts.now
        : Date.now();
  const now = new Date(nowMs);
  const since =
    opts.since instanceof Date
      ? opts.since
      : typeof opts.since === 'number'
        ? new Date(opts.since)
        : new Date(nowMs - 30 * 86_400_000);
  const halfLifeDays = Math.max(1, Number(opts.halfLifeDays) || 15);
  const msPerDay = 86_400_000;

  const rows = await ListenEvent.aggregate([
    {
      $match: {
        listenedAt: { $gte: since, $lte: now },
        listenedSeconds: { $gt: 0 },
      },
    },
    {
      $addFields: {
        weight: {
          $pow: [
            0.5,
            {
              $divide: [
                {
                  $divide: [{ $subtract: [now, '$listenedAt'] }, msPerDay],
                },
                halfLifeDays,
              ],
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: {
          category: '$category',
          contentType: '$contentType',
          contentId: '$contentId',
        },
        weightedSeconds: {
          $sum: { $multiply: ['$listenedSeconds', '$weight'] },
        },
        weightSum: { $sum: '$weight' },
      },
    },
  ]);

  /** @type {Map<string, number>} */
  const map = new Map();
  for (const row of rows) {
    const cat = String(row._id?.category || '').trim();
    const type = String(row._id?.contentType || '').trim();
    const id = String(row._id?.contentId || '').trim();
    if (!cat || !type || !id) continue;
    const w = Number(row.weightSum) || 0;
    const avg = w > 0 ? (Number(row.weightedSeconds) || 0) / w : 0;
    map.set(`${cat}\0${type}\0${id}`, avg);
  }
  return map;
};

module.exports = {
  createListenEvent,
  countPriorListens,
  findListenEventById,
  aggregateListenStatsByCategory,
  averageListenedSecondsByCategory,
};
