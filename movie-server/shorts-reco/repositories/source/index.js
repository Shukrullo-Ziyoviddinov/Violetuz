'use strict';

const { createShortsSource } = require('./shorts.source');
const { createMoviesSource } = require('./movies.source');
const { createArtistsSource } = require('./artists.source');
const { createMusicSource } = require('./music.source');

/**
 * @param {import('mongoose').Connection|import('mongodb').Db} connection
 */
const createReadSources = (connection) => ({
  shorts: createShortsSource(connection),
  movies: createMoviesSource(connection),
  artists: createArtistsSource(connection),
  music: createMusicSource(connection),
});

module.exports = {
  createReadSources,
};
