/**
 * movie-similar servislari.
 *
 * @module movie-similar/services
 */

'use strict';

const titleSimilarityMatcher = require('./titleSimilarityMatcher');
const similarMoviesEngine = require('./similarMoviesEngine');

module.exports = {
  ...titleSimilarityMatcher,
  ...similarMoviesEngine,
};
