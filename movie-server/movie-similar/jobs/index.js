/**
 * movie-similar fon ishlari.
 * recommendation / home-feed / music-mixes navbatidan alohida.
 *
 * @module movie-similar/jobs
 */

'use strict';

const {
  collectAffectedMovieIds,
  refreshSimilarForMovieIds,
  refreshAllSimilarMovies,
  startMovieSimilarityPrecomputeScheduler,
  stopMovieSimilarityPrecomputeScheduler,
} = require('./movieSimilarityPrecompute.job');

module.exports = {
  collectAffectedMovieIds,
  refreshSimilarForMovieIds,
  refreshAllSimilarMovies,
  startMovieSimilarityPrecomputeScheduler,
  stopMovieSimilarityPrecomputeScheduler,
};
