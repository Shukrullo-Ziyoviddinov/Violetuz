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

module.exports = {
  createListenEvent,
  countPriorListens,
  findListenEventById,
};
