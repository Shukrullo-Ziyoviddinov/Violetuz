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
const createProfileRepo = (connection) => {
  const col = () => connection.collection(collections.reco.userProfiles);

  return {
    /**
     * @param {string} userId
     */
    async findByUserId(userId) {
      const doc = await col().findOne({ userId });
      return stripId(doc);
    },

    /**
     * @param {object} profile
     */
    async save(profile) {
      const { _id, ...rest } = profile;
      await col().replaceOne({ userId: rest.userId }, rest, { upsert: true });
    },
  };
};

module.exports = {
  createProfileRepo,
};
