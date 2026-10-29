'use strict';

const config = require('../config');
const collections = require('../config/collections');

/**
 * @param {import('mongoose').Connection|import('mongodb').Db} connection
 */
const createStatsRepo = (connection) => {
  const col = () => connection.collection(collections.reco.shortStats);

  return {
    /**
     * @param {number} [limit]
     * @returns {Promise<object[]>}
     */
    async listTop(limit) {
      const size = Math.max(1, limit || config.candidateFetchLimit);
      const docs = await col()
        .find({})
        .sort({ views: -1, shortId: 1 })
        .limit(size)
        .toArray();
      return docs.map((doc) => {
        const { _id, ...rest } = doc;
        return rest;
      });
    },

    /**
     * @param {string} shortId
     * @param {{ views?: number, completions?: number, likes?: number, comments?: number, shares?: number }} delta
     * @param {Date} updatedAt
     */
    async applyDelta(shortId, delta, updatedAt) {
      await col().updateOne(
        { shortId },
        {
          $inc: {
            views: delta.views || 0,
            completions: delta.completions || 0,
            likes: delta.likes || 0,
            comments: delta.comments || 0,
            shares: delta.shares || 0,
          },
          $set: { updatedAt },
          $setOnInsert: { shortId },
        },
        { upsert: true }
      );
    },
  };
};

module.exports = {
  createStatsRepo,
};
