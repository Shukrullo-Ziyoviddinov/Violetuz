'use strict';

const config = require('../config');
const collections = require('../config/collections');
const { shortCatalogId, parseShortCatalogId, toFiniteNumber } = require('../utils/keys');

/**
 * @param {import('mongoose').Connection|import('mongodb').Db} connection
 */
const createCatalogRepo = (connection) => {
  const col = () => connection.collection(collections.reco.shortCatalog);

  return {
    /**
     * Insert or replace catalog fields. catalogAddedAt is set only on first insert.
     * @param {object[]} records
     * @param {Date} addedAt
     */
    async bulkUpsert(records, addedAt) {
      if (records.length === 0) return { upserted: 0, modified: 0 };
      const ops = records.map((record) => ({
        updateOne: {
          filter: { shortId: record.shortId },
          update: {
            $set: record,
            $setOnInsert: { catalogAddedAt: addedAt },
          },
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
     * @param {string[]} shortIds
     * @returns {Promise<number>}
     */
    async removeExcept(shortIds) {
      const result = shortIds.length
        ? await col().deleteMany({ shortId: { $nin: shortIds } })
        : await col().deleteMany({});
      return result.deletedCount || 0;
    },

    /**
     * Numeric ids are resolved to `type:id`. Two matches are treated as unknown.
     * @param {unknown} shortId
     * @returns {Promise<object|null>}
     */
    async findByClientShortId(shortId) {
      if (typeof shortId === 'string' && shortId.includes(':') && parseShortCatalogId(shortId)) {
        return col().findOne({ shortId });
      }
      const numericId = toFiniteNumber(shortId);
      if (numericId == null || numericId < 0) return null;
      const ids = [
        shortCatalogId(collections.existing.shortsVideos.type, numericId),
        shortCatalogId(collections.existing.musicShorts.type, numericId),
      ];
      const docs = await col().find({ shortId: { $in: ids } }).limit(2).toArray();
      if (docs.length !== 1) return null;
      return docs[0];
    },

    /**
     * Actors copied onto movieShorts. First document wins per movie.
     * @param {Array<number>} movieIds
     * @returns {Promise<Map<number, Array<number|string>>>}
     */
    async findActorsForMovies(movieIds) {
      const ids = (movieIds || []).filter((id) => id != null);
      const found = new Map();
      if (ids.length === 0) return found;
      const docs = await col()
        .find(
          {
            type: collections.existing.shortsVideos.type,
            movieId: { $in: ids },
          },
          { projection: { movieId: 1, actors: 1, _id: 0 } }
        )
        .toArray();
      for (let i = 0; i < docs.length; i += 1) {
        const movieId = docs[i].movieId;
        if (movieId == null || found.has(movieId)) continue;
        found.set(movieId, Array.isArray(docs[i].actors) ? docs[i].actors : []);
      }
      return found;
    },

    /**
     * Shorts whose artistId is the same value and the same type.
     * @param {unknown} artistId
     * @param {number} [limit]
     * @returns {Promise<object[]>}
     */
    async findByArtistId(artistId, limit) {
      if (typeof artistId === 'string') {
        if (!artistId) return [];
      } else if (typeof artistId !== 'number' || !Number.isSafeInteger(artistId)) {
        return [];
      }
      const size = Math.max(1, limit || 100);
      const docs = await col().find({ artistId }).limit(size).toArray();
      return docs.map((doc) => {
        if (!doc) return doc;
        const { _id, ...rest } = doc;
        return rest;
      });
    },

    /**
     * Candidate read for the feed. Sort defaults to newest catalog rows.
     * @param {object} filter
     * @param {number} [limit]
     * @param {object} [sort]
     * @returns {Promise<object[]>}
     */
    async findMatching(filter, limit, sort) {
      const size = Math.max(1, limit || config.candidateFetchLimit);
      const docs = await col()
        .find(filter || {})
        .sort(sort || { catalogAddedAt: -1 })
        .limit(size)
        .toArray();
      return docs.map((doc) => {
        if (!doc) return doc;
        const { _id, ...rest } = doc;
        return rest;
      });
    },
  };
};

/**
 * @param {object[]} records
 * @param {number} [batchSize]
 * @returns {object[][]}
 */
const chunkRecords = (records, batchSize = config.catalogSyncBatchSize) => {
  const chunks = [];
  for (let offset = 0; offset < records.length; offset += batchSize) {
    chunks.push(records.slice(offset, offset + batchSize));
  }
  return chunks;
};

module.exports = {
  createCatalogRepo,
  chunkRecords,
};
