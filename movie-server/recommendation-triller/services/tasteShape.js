/**
 * Did o‘qishining sof qismi. Bazaga yozmaydi.
 *
 * @module recommendation-triller/services/tasteShape
 */

'use strict';

/**
 * Hisob bo‘lsa local tarix hisobga kirmaydi.
 *
 * @param {{ userId?: * }} [input]
 * @returns {'account'|'guest'}
 */
const selectTasteSource = (input = {}) => {
  if (input.userId != null && input.userId !== '') return 'account';
  return 'guest';
};

/**
 * Ko‘rilgan kino yo‘q. Bo‘sh mehmon va yangi bo‘sh hisob.
 *
 * @param {{ ok?: boolean, watchedMovieCount?: number }} [taste]
 * @returns {boolean}
 */
const isViewerWithoutMovies = (taste) =>
  Boolean(taste) && taste.ok !== false && (Number(taste.watchedMovieCount) || 0) === 0;

/**
 * @param {Map<string, number>} into
 * @param {Object.<string, number>} [scores]
 */
const addScores = (into, scores) => {
  if (!scores || typeof scores !== 'object') return into;
  for (const [value, raw] of Object.entries(scores)) {
    const token = String(value || '').trim();
    const score = Number(raw);
    if (!token || !Number.isFinite(score) || score <= 0) continue;
    into.set(token, (into.get(token) || 0) + score);
  }
  return into;
};

/**
 * @param {Map<string, number>} scores
 * @returns {Array<{ value: string, score: number }>}
 */
const toRankedList = (scores) =>
  [...scores.entries()]
    .map(([value, score]) => ({ value, score }))
    .sort((a, b) => b.score - a.score || a.value.localeCompare(b.value));

/**
 * Mehmon tarixidagi turli kinolar bo‘yicha aktyor +1.
 * Katalogdagi actors maydoni. Hisobga yozilmaydi.
 *
 * @param {Array<{ m: number }>} events
 * @param {Map<string|number, Object>|Object} moviesById
 * @param {(raw: unknown) => string[]} toEntityIdList
 * @returns {Array<{ actorId: string, score: number }>}
 */
const countGuestActors = (events, moviesById, toEntityIdList) => {
  /** @type {Map<string, number>} */
  const scores = new Map();
  const seenMovies = new Set();

  for (const event of events || []) {
    const movieKey = String(event?.m ?? '');
    if (!movieKey || seenMovies.has(movieKey)) continue;
    seenMovies.add(movieKey);

    const movie =
      (typeof moviesById?.get === 'function'
        ? moviesById.get(event.m) || moviesById.get(movieKey)
        : moviesById?.[event.m] || moviesById?.[movieKey]) || null;
    if (!movie) continue;

    for (const actorId of toEntityIdList(movie.actors)) {
      scores.set(actorId, (scores.get(actorId) || 0) + 1);
    }
  }

  return [...scores.entries()]
    .map(([actorId, score]) => ({ actorId, score }))
    .sort((a, b) => b.score - a.score || a.actorId.localeCompare(b.actorId));
};

module.exports = {
  selectTasteSource,
  isViewerWithoutMovies,
  addScores,
  toRankedList,
  countGuestActors,
};
