/**
 * Ko‘rilgan kinoning treyleri.
 * O‘chmaydi. Ko‘rilmagan o‘xshash treylerlarning ostida turadi.
 * Mos kelmagan treylerlardan ham pastga tushmaydi.
 * Sof tartib, bazaga yozmaydi.
 *
 * @module similar-trailers/watchedOrder
 */

'use strict';

/**
 * @param {Array<number|string>} watchedMovieIds
 * @returns {Set<string>}
 */
const watchedSet = (watchedMovieIds) =>
  new Set((watchedMovieIds || []).map((id) => String(id)));

/**
 * @param {Object} trailer
 * @returns {boolean}
 */
const isSimilar = (trailer) => {
  const closeness = Number(trailer?.closeness);
  return Number.isFinite(closeness) && closeness > 0;
};

/**
 * @param {Object} left
 * @param {Object} right
 * @returns {number}
 */
const byCloseness = (left, right) =>
  (Number(right?.closeness) || 0) - (Number(left?.closeness) || 0);

/**
 * @param {Array<Object>} trailers
 * @param {Array<number|string>} [watchedMovieIds]
 * @returns {Array<Object>}
 */
const orderWatchedLower = (trailers, watchedMovieIds) => {
  const watched = watchedSet(watchedMovieIds);
  /** @type {Array<Object>} */
  const unwatchedSimilar = [];
  /** @type {Array<Object>} */
  const watchedSimilar = [];
  /** @type {Array<Object>} */
  const rest = [];

  for (const trailer of trailers || []) {
    const seen = watched.has(String(trailer?.movieId));
    if (isSimilar(trailer) && !seen) unwatchedSimilar.push(trailer);
    else if (isSimilar(trailer) && seen) watchedSimilar.push(trailer);
    else rest.push(trailer);
  }

  return [...unwatchedSimilar.sort(byCloseness), ...watchedSimilar.sort(byCloseness), ...rest]
    .map((trailer) => ({ ...trailer }));
};

module.exports = {
  orderWatchedLower,
};
