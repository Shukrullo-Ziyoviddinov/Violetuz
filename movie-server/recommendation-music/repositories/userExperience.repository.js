/**
 * Music user experience (confidence α) — per user × categoryNameMusic.
 * experienceCount = quality listens ∪ clip/concert likes in category.
 *
 * @module recommendation-music/repositories/userExperience.repository
 */

'use strict';

const UserReaction = require('../../models/UserReaction.model');
const Clip = require('../../models/Clip.model');
const Concert = require('../../models/Concert.model');
const { UserMusicProgress } = require('../models');
const { scoringWeights } = require('../config/scoringWeights');

const qualityMinCompletion = (weights = scoringWeights) => {
  const n = weights.blend?.qualityMinCompletion;
  return typeof n === 'number' && !Number.isNaN(n) ? n : 0.3;
};

/**
 * @param {*} userId
 * @param {string} category
 * @param {number} minCompletion
 * @returns {Promise<string[]>} contentKeys
 */
const listQualityListenContentKeys = async (userId, category, minCompletion) => {
  const cat = String(category || '').trim();
  if (!userId || !cat) return [];

  const rows = await UserMusicProgress.find({
    userId,
    category: cat,
    completionRate: { $gt: minCompletion },
  })
    .select({ contentKey: 1, _id: 0 })
    .lean();

  return [...new Set((rows || []).map((r) => String(r.contentKey)).filter(Boolean))];
};

/**
 * Clip/concert likes in this categoryNameMusic.
 * @returns {Promise<string[]>} contentKeys clip:id / concert:id
 */
const listLikedMusicContentKeysInCategory = async (userId, category) => {
  const cat = String(category || '').trim();
  if (!userId || !cat) return [];

  const likes = await UserReaction.find({
    userId,
    type: { $in: ['klip', 'konsert'] },
    value: 'like',
  })
    .select({ type: 1, targetId: 1, _id: 0 })
    .lean();

  if (!likes.length) return [];

  const clipIds = [];
  const concertIds = [];
  for (const row of likes) {
    const id = String(row.targetId ?? '').trim();
    if (!id) continue;
    if (row.type === 'klip') clipIds.push(Number(id));
    if (row.type === 'konsert') concertIds.push(Number(id));
  }

  const keys = [];
  if (clipIds.length) {
    const docs = await Clip.find({
      id: { $in: clipIds.filter((n) => Number.isInteger(n)) },
      categoryNameMusic: cat,
    })
      .select({ id: 1, _id: 0 })
      .lean();
    for (const d of docs) keys.push(`clip:${d.id}`);
  }
  if (concertIds.length) {
    const docs = await Concert.find({
      id: { $in: concertIds.filter((n) => Number.isInteger(n)) },
      categoryNameMusic: cat,
    })
      .select({ id: 1, _id: 0 })
      .lean();
    for (const d of docs) keys.push(`concert:${d.id}`);
  }

  return [...new Set(keys)];
};

const getUserExperienceCount = async (userId, category, opts = {}) => {
  if (!userId) return 0;
  const cat = String(category || '').trim();
  if (!cat) return 0;

  const minCompletion =
    typeof opts.minCompletion === 'number'
      ? opts.minCompletion
      : qualityMinCompletion();

  const [listenKeys, likeKeys] = await Promise.all([
    listQualityListenContentKeys(userId, cat, minCompletion),
    listLikedMusicContentKeysInCategory(userId, cat),
  ]);

  const set = new Set([...listenKeys, ...likeKeys]);
  return set.size;
};

module.exports = {
  qualityMinCompletion,
  listQualityListenContentKeys,
  listLikedMusicContentKeysInCategory,
  getUserExperienceCount,
};
