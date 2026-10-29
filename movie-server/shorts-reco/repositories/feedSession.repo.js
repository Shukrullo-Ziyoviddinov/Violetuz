'use strict';

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
const createFeedSessionRepo = (connection) => {
  const col = () => connection.collection(collections.reco.feedSessions);

  return {
    /**
     * @param {string} sessionId
     */
    async findById(sessionId) {
      if (!sessionId) return null;
      return stripId(await col().findOne({ sessionId }));
    },

    /**
     * @param {object} doc
     */
    async save(doc) {
      const { _id, ...rest } = doc;
      await col().replaceOne({ sessionId: rest.sessionId }, rest, { upsert: true });
    },
  };
};

module.exports = {
  createFeedSessionRepo,
};
