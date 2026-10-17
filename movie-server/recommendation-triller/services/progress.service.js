/**
 * Parda ortida video foizini yozish va o‘qish.
 * Kino progressi, janr didi va aktyor baliga yozilmaydi.
 *
 * @module recommendation-triller/services/progress.service
 */

'use strict';

const Triller = require('../../models/Triller.model');
const { badRequest, notFound } = require('../../utils/errors');
const { resolveCompletionRate } = require('../utils/completion');
const {
  upsertMaxProgress,
  listByUser,
} = require('../repositories/userTrillerProgress.repository');

const parseTrillerId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
};

/**
 * Hisobdagi foydalanuvchi uchun. Mehmon bu funksiyaga kelmaydi.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {Object} input
 * @param {number} input.trillerId
 * @param {number} [input.completionRate]
 * @param {number} [input.watchedSeconds]
 * @param {number} [input.durationSec]
 */
const reportTrillerProgress = async (userId, input = {}) => {
  if (!userId) throw badRequest('userId majburiy');

  const trillerId = parseTrillerId(input.trillerId ?? input.id);
  if (trillerId == null) throw badRequest('trillerId majburiy');

  const exists = await Triller.findOne({ id: trillerId }).select({ id: 1 }).lean();
  if (!exists) throw notFound(`Triller not found: ${trillerId}`);

  const completionRate = resolveCompletionRate(input);
  const { progress, raised } = await upsertMaxProgress({
    userId,
    trillerId,
    completionRate,
  });

  return {
    trillerId,
    completionRate: Number(progress.completionRate) || 0,
    raised,
  };
};

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 */
const listTrillerProgress = async (userId) => {
  if (!userId) throw badRequest('userId majburiy');
  const items = await listByUser(userId);
  return { items };
};

module.exports = {
  reportTrillerProgress,
  listTrillerProgress,
};
