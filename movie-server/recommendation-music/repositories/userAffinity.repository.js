/**
 * UserMusicAffinity persistence.
 *
 * @module recommendation-music/repositories/userAffinity.repository
 */

'use strict';

const { UserMusicAffinity } = require('../models');
const { scoringWeights } = require('../config/scoringWeights');

const listAffinities = async (userId, category) =>
  UserMusicAffinity.find({
    userId,
    category: String(category).trim(),
  })
    .select({
      dimensionType: 1,
      dimensionValue: 1,
      affinityScore: 1,
      updatedAt: 1,
      _id: 0,
    })
    .lean();

const getAffinityMapWithMeta = async (userId, category) => {
  const rows = await listAffinities(userId, category);
  /** @type {Object.<string, Object.<string, { score: number, updatedAt: Date }>>} */
  const map = {};

  for (const row of rows) {
    if (!map[row.dimensionType]) map[row.dimensionType] = {};
    map[row.dimensionType][row.dimensionValue] = {
      score: row.affinityScore,
      updatedAt: row.updatedAt,
    };
  }

  return map;
};

const bulkUpsertAffinities = async (cells) => {
  if (!Array.isArray(cells) || cells.length === 0) {
    return { upserted: 0, modified: 0 };
  }

  const now = new Date();
  const maxScore = scoringWeights.decay.maxScore;

  const ops = cells.map((cell) => ({
    updateOne: {
      filter: {
        userId: cell.userId,
        category: String(cell.category).trim(),
        dimensionType: cell.dimensionType,
        dimensionValue: cell.dimensionValue,
      },
      update: {
        $set: {
          affinityScore: Math.min(maxScore, Math.max(0, cell.affinityScore)),
          updatedAt: cell.updatedAt || now,
        },
        $setOnInsert: {
          userId: cell.userId,
          category: String(cell.category).trim(),
          dimensionType: cell.dimensionType,
          dimensionValue: cell.dimensionValue,
        },
      },
      upsert: true,
    },
  }));

  const result = await UserMusicAffinity.bulkWrite(ops, { ordered: false });
  return {
    upserted: result.upsertedCount || 0,
    modified: result.modifiedCount || 0,
  };
};

/**
 * @param {*} userId
 * @param {string} category
 * @param {Array<{ dimensionType: string, dimensionValue: string }>} keys
 * @returns {Promise<Map<string, Object>>}
 */
const findAffinityCells = async (userId, category, keys) => {
  /** @type {Map<string, Object>} */
  const map = new Map();
  if (!Array.isArray(keys) || !keys.length) return map;

  const cat = String(category).trim();
  const or = keys.map((k) => ({
    dimensionType: k.dimensionType,
    dimensionValue: k.dimensionValue,
  }));

  const rows = await UserMusicAffinity.find({
    userId,
    category: cat,
    $or: or,
  }).lean();

  for (const row of rows) {
    map.set(`${row.dimensionType}\0${row.dimensionValue}`, row);
  }
  return map;
};

module.exports = {
  listAffinities,
  getAffinityMapWithMeta,
  bulkUpsertAffinities,
  findAffinityCells,
};
