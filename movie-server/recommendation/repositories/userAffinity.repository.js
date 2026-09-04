/**
 * UserAffinity persistence.
 *
 * @module recommendation/repositories/userAffinity.repository
 */

'use strict';

const { UserAffinity } = require('../models');
const { scoringWeights } = require('../config/scoringWeights');

/**
 * Load all affinity cells for user × category.
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} category
 * @returns {Promise<Array<{ dimensionType: string, dimensionValue: string, affinityScore: number, updatedAt: Date }>>}
 */
const listAffinities = async (userId, category) =>
  UserAffinity.find({
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

/**
 * Build affinity map with score + updatedAt (for decay at read time).
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} category
 * @returns {Promise<Object>}
 */
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

/**
 * Upsert one affinity cell.
 * @param {Object} cell
 * @returns {Promise<Object>}
 */
const upsertAffinity = async (cell) =>
  UserAffinity.findOneAndUpdate(
    {
      userId: cell.userId,
      category: String(cell.category).trim(),
      dimensionType: cell.dimensionType,
      dimensionValue: cell.dimensionValue,
    },
    {
      $set: {
        affinityScore: cell.affinityScore,
        updatedAt: cell.updatedAt || new Date(),
      },
      $setOnInsert: {
        userId: cell.userId,
        category: String(cell.category).trim(),
        dimensionType: cell.dimensionType,
        dimensionValue: cell.dimensionValue,
      },
    },
    { upsert: true, new: true, lean: true }
  );

/**
 * Bulk upsert affinity cells (one watch → many dimension values).
 * @param {Array<Object>} cells
 * @returns {Promise<{ upserted: number, modified: number }>}
 */
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

  const result = await UserAffinity.bulkWrite(ops, { ordered: false });
  return {
    upserted: result.upsertedCount || 0,
    modified: result.modifiedCount || 0,
  };
};

/**
 * Fetch existing cells for a set of (type, value) keys.
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} category
 * @param {Array<{ dimensionType: string, dimensionValue: string }>} keys
 * @returns {Promise<Map<string, { affinityScore: number, updatedAt: Date }>>}
 */
const findAffinityCells = async (userId, category, keys) => {
  /** @type {Map<string, { affinityScore: number, updatedAt: Date }>} */
  const map = new Map();
  if (!keys.length) return map;

  const or = keys.map((k) => ({
    dimensionType: k.dimensionType,
    dimensionValue: k.dimensionValue,
  }));

  const rows = await UserAffinity.find({
    userId,
    category: String(category).trim(),
    $or: or,
  })
    .select({ dimensionType: 1, dimensionValue: 1, affinityScore: 1, updatedAt: 1 })
    .lean();

  for (const row of rows) {
    map.set(`${row.dimensionType}\0${row.dimensionValue}`, {
      affinityScore: row.affinityScore,
      updatedAt: row.updatedAt,
    });
  }

  return map;
};

module.exports = {
  listAffinities,
  getAffinityMapWithMeta,
  upsertAffinity,
  bulkUpsertAffinities,
  findAffinityCells,
};
