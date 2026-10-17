/**
 * Kino ichidagi trailersVideo dan treyler katalogi.
 * Janr, davlat va aktyor kino obyektidan olinadi.
 * Yangi maydon va yangi kolleksiya yo‘q. Bazaga yozmaydi.
 *
 * @module similar-trailers/catalog
 */

'use strict';

const { toStringList } = require('../recommendation/utils/values');
const { toEntityIdList } = require('../recommendation-shared/entityDistinctCount');

/**
 * @param {unknown} raw
 * @returns {number|null}
 */
const normalizeMovieId = (raw) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
};

/**
 * @param {unknown} raw
 * @returns {Object|null}
 */
const plainTrailer = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const source = typeof raw.toObject === 'function' ? raw.toObject() : raw;
  return {
    id: source.id == null ? null : source.id,
    trailers: source.trailers ?? null,
    title: source.title ?? null,
    text: source.text ?? null,
    like: source.like ?? '',
    dislike: source.dislike ?? '',
    typeTrailers: source.typeTrailers ?? '',
  };
};

/**
 * @param {Array<Object>} movies
 * @returns {Array<Object>}
 */
const collectMovieTrailers = (movies) => {
  /** @type {Array<Object>} */
  const out = [];
  const seen = new Set();

  for (const movie of movies || []) {
    const movieId = normalizeMovieId(movie?.id);
    if (movieId == null) continue;

    const trailers = Array.isArray(movie.trailersVideo) ? movie.trailersVideo : [];
    if (!trailers.length) continue;

    const filterGenre = toStringList(movie.filterGenre);
    const filterCountry = toStringList(movie.filterCountry);
    const actors = toEntityIdList(movie.actors);

    trailers.forEach((raw, index) => {
      const trailer = plainTrailer(raw);
      if (!trailer) return;

      const slot = index + 1;
      const trailerKey = trailer.id == null ? `slot:${slot}` : `id:${trailer.id}`;
      const key = `${movieId}:${trailerKey}`;
      if (seen.has(key)) return;
      seen.add(key);

      out.push({
        ...trailer,
        movieId,
        trailerIndex: slot,
        filterGenre,
        filterCountry,
        actors,
      });
    });
  }

  return out;
};

module.exports = {
  collectMovieTrailers,
};
