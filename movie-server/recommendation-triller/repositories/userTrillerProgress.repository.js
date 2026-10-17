/**
 * Hisob × video foizi. Faqat oshganda yangilanadi.
 *
 * @module recommendation-triller/repositories/userTrillerProgress.repository
 */

'use strict';

const { UserTrillerProgress } = require('../models');

const findProgress = async (userId, trillerId) =>
  UserTrillerProgress.findOne({
    userId,
    trillerId: Number(trillerId),
  }).lean();

/**
 * @param {Object} input
 * @param {*} input.userId
 * @param {number} input.trillerId
 * @param {number} input.completionRate
 * @returns {Promise<{ progress: Object, previous: Object|null, raised: boolean }>}
 */
const upsertMaxProgress = async (input) => {
  const trillerId = Number(input.trillerId);
  const completionRate = Math.min(1, Math.max(0, Number(input.completionRate) || 0));
  const now = new Date();

  const previous = await findProgress(input.userId, trillerId);

  const progress = await UserTrillerProgress.findOneAndUpdate(
    { userId: input.userId, trillerId },
    {
      $max: { completionRate },
      $set: { updatedAt: now },
      $setOnInsert: {
        userId: input.userId,
        trillerId,
      },
    },
    { upsert: true, new: true, lean: true }
  );

  const raised =
    !previous || (progress.completionRate || 0) > (previous.completionRate || 0) + 1e-9;

  return { progress, previous, raised: Boolean(raised) };
};

/**
 * @param {*} userId
 * @returns {Promise<Array<{ trillerId: number, completionRate: number }>>}
 */
const listByUser = async (userId) => {
  const rows = await UserTrillerProgress.find({ userId })
    .select({ trillerId: 1, completionRate: 1, _id: 0 })
    .lean();

  return (rows || []).map((row) => ({
    trillerId: Number(row.trillerId),
    completionRate: Number(row.completionRate) || 0,
  }));
};

module.exports = {
  findProgress,
  upsertMaxProgress,
  listByUser,
};
