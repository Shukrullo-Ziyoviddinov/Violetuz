/**
 * O‘xshash treylerlar ro‘yxatini yig‘adi. Sof, bazaga yozmaydi.
 * Kinolar yaqinlik, ko‘rilganlik va aralash tartibida chiqadi.
 * Bir kino ichidagi treylerlar trailersVideo joyida qoladi.
 * Har bir treyler bir marta.
 *
 * @module similar-trailers/assemble
 */

'use strict';

const { orderByCloseness } = require('./closeness');
const { orderWatchedLower } = require('./watchedOrder');
const { mixTrailers } = require('./mix');

/**
 * @param {Object} trailer
 * @returns {string}
 */
const trailerKey = (trailer) => {
  const movieId = String(trailer?.movieId ?? '');
  const trailerId = trailer?.id == null ? `slot:${trailer?.trailerIndex ?? ''}` : `id:${trailer.id}`;
  return `${movieId}:${trailerId}`;
};

/**
 * @param {Array<Object>} trailers
 * @returns {Array<Object>}
 */
const uniqueTrailers = (trailers) => {
  const seen = new Set();
  /** @type {Array<Object>} */
  const list = [];
  for (const trailer of trailers || []) {
    if (!trailer || trailer.movieId == null || trailer.movieId === '') continue;
    const key = trailerKey(trailer);
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(trailer);
  }
  return list;
};

/**
 * @param {Array<Object>} trailers
 * @returns {Map<string, Array<Object>>}
 */
const trailersByMovie = (trailers) => {
  /** @type {Map<string, Array<Object>>} */
  const byMovie = new Map();
  for (const trailer of trailers) {
    const movieId = String(trailer.movieId);
    if (!byMovie.has(movieId)) byMovie.set(movieId, []);
    byMovie.get(movieId).push(trailer);
  }
  for (const list of byMovie.values()) {
    list.sort((left, right) => (Number(left.trailerIndex) || 0) - (Number(right.trailerIndex) || 0));
  }
  return byMovie;
};

/**
 * @param {Array<Object>} trailers
 * @param {{ genres?: Array<Object>, countries?: Array<Object>, actors?: Array<Object>, watchedMovieIds?: Array<number|string> }} [taste]
 * @returns {Array<Object>}
 */
const assembleSimilarTrailers = (trailers, taste) => {
  const unique = uniqueTrailers(trailers);
  const byMovie = trailersByMovie(unique);
  const ranked = mixTrailers(
    orderWatchedLower(orderByCloseness(unique, taste), taste?.watchedMovieIds),
    taste?.watchedMovieIds
  );

  const seenMovies = new Set();
  /** @type {Array<Object>} */
  const out = [];

  for (const trailer of ranked) {
    const movieId = String(trailer?.movieId ?? '');
    if (!movieId || seenMovies.has(movieId)) continue;
    seenMovies.add(movieId);
    const closeness = Number(trailer?.closeness) || 0;
    for (const item of byMovie.get(movieId) || []) {
      out.push({ ...item, closeness });
    }
  }

  return out;
};

module.exports = {
  assembleSimilarTrailers,
};
