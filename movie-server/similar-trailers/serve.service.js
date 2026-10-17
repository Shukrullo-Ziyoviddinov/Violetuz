/**
 * .similar-trailers-list uchun ro‘yxat.
 * Kinolarni va tayyor didni o‘qiydi. Hech qayerga yozmaydi.
 *
 * @module similar-trailers/serve.service
 */

'use strict';

const Movie = require('../models/Movie.model');
const { badRequest } = require('../utils/errors');
const { collectMovieTrailers } = require('./catalog');
const { readTaste } = require('./taste.read');
const { assembleSimilarTrailers } = require('./assemble');

const hasAccount = (userId) => userId != null && userId !== '';

/**
 * @param {Object} trailer
 * @param {Object|undefined} movie
 * @returns {Object}
 */
const toPublicTrailer = (trailer, movie) => ({
  id: trailer.id,
  trailers: trailer.trailers ?? null,
  title: trailer.title ?? null,
  text: trailer.text ?? null,
  like: trailer.like ?? '',
  dislike: trailer.dislike ?? '',
  typeTrailers: trailer.typeTrailers ?? '',
  movieId: trailer.movieId,
  trailerIndex: trailer.trailerIndex,
  movieTitle: movie?.title ?? null,
  ratingImdb: movie?.ratingImdb ?? null,
});

/**
 * @param {Array<Object>} movies
 * @param {Object} taste
 * @returns {Array<Object>}
 */
const buildSimilarTrailerList = (movies, taste) => {
  const meta = new Map(
    (movies || []).map((movie) => [Number(movie?.id), movie])
  );
  return assembleSimilarTrailers(collectMovieTrailers(movies), taste).map((trailer) =>
    toPublicTrailer(trailer, meta.get(Number(trailer.movieId)))
  );
};

const loadMovies = async () =>
  Movie.find({})
    .select({
      _id: 0,
      id: 1,
      title: 1,
      ratingImdb: 1,
      filterGenre: 1,
      filterCountry: 1,
      actors: 1,
      trailersVideo: 1,
    })
    .sort({ id: 1 })
    .lean();

/**
 * Hisob bo‘lsa faqat hisob. Mehmon local tarixi akkauntga yozilmaydi.
 *
 * @param {{ userId?: *, localHistory?: unknown }} [input]
 * @returns {Promise<Array<Object>>}
 */
const serveSimilarTrailers = async (input = {}) => {
  const movies = await loadMovies();
  const taste = hasAccount(input.userId)
    ? await readTaste({ userId: input.userId })
    : await readTaste({ localHistory: input.localHistory });

  if (!taste || taste.ok === false) {
    throw badRequest(taste?.error || 'Did o‘qilmadi');
  }

  return buildSimilarTrailerList(movies, taste);
};

module.exports = {
  serveSimilarTrailers,
  buildSimilarTrailerList,
};
