'use strict';

const collections = require('../config/collections');

/**
 * @param {import('mongoose').Connection|import('mongodb').Db} connection
 */
const createSongLinksRepo = (connection) => {
  const col = () => connection.collection(collections.reco.songLinks);

  return {
    /**
     * @param {object[]} groups
     */
    async bulkUpsert(groups) {
      if (groups.length === 0) return { upserted: 0, modified: 0 };
      const ops = groups.map((group) => ({
        updateOne: {
          filter: { songGroupId: group.songGroupId },
          update: { $set: group },
          upsert: true,
        },
      }));
      const result = await col().bulkWrite(ops, { ordered: false });
      return {
        upserted: result.upsertedCount || 0,
        modified: result.modifiedCount || 0,
      };
    },

    /**
     * @param {string[]} songGroupIds
     * @returns {Promise<number>}
     */
    async removeExcept(songGroupIds) {
      const result = songGroupIds.length
        ? await col().deleteMany({ songGroupId: { $nin: songGroupIds } })
        : await col().deleteMany({});
      return result.deletedCount || 0;
    },
  };
};

module.exports = {
  createSongLinksRepo,
};
