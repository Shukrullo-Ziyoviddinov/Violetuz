/**
 * GET /api/movies/:movieId/similar
 * Faqat movie_similar_cache. Real-time engine chaqirilmaydi.
 * Auth shart emas (userdan mustaqil).
 *
 * @module movie-similar/controllers/similar.controller
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { similarityWeights } = require('../config/similarityWeights');
const { toMovieId } = require('../repositories/catalog.read');
const { listSimilarWithMovies } = require('../repositories/similarCache.repository');

const getSimilarMovies = asyncHandler(async (req, res) => {
  const movieId = toMovieId(req.params.movieId);
  if (movieId == null) {
    return sendSuccess(res, {
      data: { movieId: null, movies: [], total: 0 },
    });
  }

  const queryLimit = Number(req.query.limit);
  const limit =
    Number.isFinite(queryLimit) && queryLimit > 0
      ? Math.min(Math.floor(queryLimit), 100)
      : similarityWeights.limit;

  const rows = await listSimilarWithMovies(movieId, { limit });
  const movies = rows
    .filter((row) => row.movie)
    .map((row) => ({
      ...row.movie,
      similarMeta: {
        position: row.position,
        layer: row.layer,
        score: row.score,
      },
    }));

  return sendSuccess(res, {
    data: {
      movieId,
      movies,
      total: movies.length,
    },
  });
});

module.exports = {
  getSimilarMovies,
};
