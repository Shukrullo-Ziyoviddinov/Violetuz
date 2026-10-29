'use strict';

const collections = require('../../config/collections');
const { readPath } = require('../../utils/get');
const { blankToNull } = require('../../utils/keys');
const { projectionFrom, findByIds } = require('./batch');

/**
 * @param {import('mongoose').Connection|import('mongodb').Db} connection
 */
const createArtistsSource = (connection) => {
  if (!connection || typeof connection.collection !== 'function') {
    throw new Error('shorts-reco requires the existing database connection');
  }

  const spec = collections.existing.artists;
  const col = connection.collection(spec.name);

  return {
    /**
     * @param {Array<string>} ids
     * @returns {Promise<Map<string, object>>}
     */
    async findByIds(ids) {
      const docs = await findByIds(col, ids, {
        projection: projectionFrom(spec.fields),
        idField: spec.fields.id,
      });
      const map = new Map();
      for (let i = 0; i < docs.length; i += 1) {
        const id = blankToNull(readPath(docs[i], spec.fields.id));
        if (!id) continue;
        map.set(id, {
          id,
          genres: readPath(docs[i], spec.fields.genres),
          country: readPath(docs[i], spec.fields.country),
        });
      }
      return map;
    },
  };
};

module.exports = {
  createArtistsSource,
};
