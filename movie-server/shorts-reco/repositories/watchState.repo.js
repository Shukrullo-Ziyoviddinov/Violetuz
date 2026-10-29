'use strict';

const config = require('../config');
const collections = require('../config/collections');

/**
 * @param {object|null} doc
 */
const stripId = (doc) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
};

/**
 * @param {import('mongoose').Connection|import('mongodb').Db} connection
 */
const createWatchStateRepo = (connection) => {
  const col = () => connection.collection(collections.reco.watchState);

  return {
    /**
     * @param {string} userId
     * @param {string} shortId
     */
    async findOne(userId, shortId) {
      const doc = await col().findOne({ userId, shortId });
      return stripId(doc);
    },

    /**
     * Newest views first. The feed uses this for eligibility and cold start.
     * @param {string} userId
     * @param {number} [limit]
     */
    async listByUser(userId, limit) {
      const size = Math.max(1, limit || config.watchStateReadLimit);
      const docs = await col()
        .find({ userId })
        .sort({ lastSeenAt: -1 })
        .limit(size)
        .toArray();
      return docs.map(stripId);
    },

    /**
     * @param {object} doc
     */
    async save(doc) {
      const { _id, ...rest } = doc;
      await col().replaceOne(
        { userId: rest.userId, shortId: rest.shortId },
        rest,
        { upsert: true }
      );
    },
  };
};

module.exports = {
  createWatchStateRepo,
};
