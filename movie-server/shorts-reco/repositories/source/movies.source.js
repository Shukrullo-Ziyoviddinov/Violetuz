'use strict';

const collections = require('../../config/collections');
const { readPath } = require('../../utils/get');
const { toFiniteNumber } = require('../../utils/keys');
const { projectionFrom, findByIds } = require('./batch');

/**
 * @param {import('mongoose').Connection|import('mongodb').Db} connection
 */
const createMoviesSource = (connection) => {
  if (!connection || typeof connection.collection !== 'function') {
    throw new Error('shorts-reco requires the existing database connection');
  }

  const spec = collections.existing.movies;
  const col = connection.collection(spec.name);

  return {
    /**
     * @param {Array<number>} ids
     * @returns {Promise<Map<number, object>>}
     */
    async findByIds(ids) {
      const docs = await findByIds(col, ids, {
        projection: projectionFrom(spec.fields),
        idField: spec.fields.id,
      });
      const map = new Map();
      for (let i = 0; i < docs.length; i += 1) {
        const id = toFiniteNumber(readPath(docs[i], spec.fields.id));
        if (id == null) continue;
        map.set(id, {
          id,
          filterGenre: readPath(docs[i], spec.fields.filterGenre),
          filterCountry: readPath(docs[i], spec.fields.filterCountry),
          typeCategory: readPath(docs[i], spec.fields.typeCategory),
          actors: readPath(docs[i], spec.fields.actors),
          franchiseMovieIds: readPath(docs[i], spec.fields.franchiseMovieIds),
        });
      }
      return map;
    },
  };
};

module.exports = {
  createMoviesSource,
};
