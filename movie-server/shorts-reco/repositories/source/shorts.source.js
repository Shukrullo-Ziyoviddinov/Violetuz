'use strict';

const collections = require('../../config/collections');
const { readPath } = require('../../utils/get');
const { toFiniteNumber, blankToNull } = require('../../utils/keys');
const { projectionFrom, forEachBatch } = require('./batch');

/**
 * @param {object} doc
 * @param {{ type: string, fields: Record<string, string> }} spec
 * @param {'movie'|'music'} role
 */
const mapShort = (doc, spec, role) => {
  const fields = spec.fields;
  const numericId = toFiniteNumber(readPath(doc, fields.id));
  if (numericId == null) return null;

  if (role === 'movie') {
    return {
      role,
      type: spec.type,
      numericId,
      sourceType: blankToNull(readPath(doc, fields.type)),
      movieId: toFiniteNumber(readPath(doc, fields.movieId)),
      musicId: toFiniteNumber(readPath(doc, fields.musicId)),
    };
  }

  return {
    role,
    type: spec.type,
    numericId,
    sourceType: blankToNull(readPath(doc, fields.type)),
    musicId: toFiniteNumber(readPath(doc, fields.musicId)),
    artistId: blankToNull(readPath(doc, fields.artistId)),
    movieId: toFiniteNumber(readPath(doc, fields.movieId)),
    contentType: blankToNull(readPath(doc, fields.contentType)),
  };
};

/**
 * @param {import('mongoose').Connection|import('mongodb').Db} connection
 */
const createShortsSource = (connection) => {
  if (!connection || typeof connection.collection !== 'function') {
    throw new Error('shorts-reco requires the existing database connection');
  }

  const movieSpec = collections.existing.shortsVideos;
  const musicSpec = collections.existing.musicShorts;

  const loadAll = async (spec, role) => {
    const shorts = [];
    await forEachBatch(connection.collection(spec.name), {
      projection: projectionFrom(spec.fields),
      visitor: (docs) => {
        for (let i = 0; i < docs.length; i += 1) {
          const short = mapShort(docs[i], spec, role);
          if (short) shorts.push(short);
        }
      },
    });
    return shorts;
  };

  return {
    loadMovieShorts: () => loadAll(movieSpec, 'movie'),
    loadMusicShorts: () => loadAll(musicSpec, 'music'),
  };
};

module.exports = {
  mapShort,
  createShortsSource,
};
