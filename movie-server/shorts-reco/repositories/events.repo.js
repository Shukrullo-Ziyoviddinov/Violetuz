'use strict';

const collections = require('../config/collections');

/**
 * @param {import('mongoose').Connection|import('mongodb').Db} connection
 */
const createEventsRepo = (connection) => {
  const col = () => connection.collection(collections.reco.events);

  return {
    /**
     * @param {string} eventId
     * @param {Date} createdAt
     * @returns {Promise<boolean>} false when the id was already stored
     */
    async insertIfNew(eventId, createdAt) {
      try {
        await col().insertOne({ eventId, createdAt });
        return true;
      } catch (error) {
        if (error && error.code === 11000) return false;
        throw error;
      }
    },

    /**
     * Lets a failed write retry with the same event id.
     * @param {string} eventId
     */
    async remove(eventId) {
      await col().deleteOne({ eventId });
    },
  };
};

module.exports = {
  createEventsRepo,
};
