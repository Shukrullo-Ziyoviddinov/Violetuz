/**
 * Treyler yaqinligi. Sof hisob, bazaga yozmaydi.
 * Mos kelgan janr, davlat va aktyor balllari qo‘shiladi.
 * Teng ro‘yxat shart emas. Tushmagan belgi qolgan ballni kamaytirmaydi.
 *
 * @module similar-trailers/closeness
 */

'use strict';

/**
 * @param {Array<{ value?: string, actorId?: string, score?: number }>} rows
 * @param {'value'|'actorId'} key
 * @returns {Map<string, number>}
 */
const scoreMap = (rows, key) => {
  /** @type {Map<string, number>} */
  const scores = new Map();
  for (const row of rows || []) {
    const token = String(row?.[key] ?? '').trim();
    const score = Number(row?.score);
    if (!token || !Number.isFinite(score) || score <= 0) continue;
    scores.set(token, (scores.get(token) || 0) + score);
  }
  return scores;
};

/**
 * @param {string[]|undefined} tokens
 * @param {Map<string, number>} scores
 * @returns {number}
 */
const sumMatched = (tokens, scores) => {
  let sum = 0;
  const seen = new Set();
  for (const raw of tokens || []) {
    const token = String(raw ?? '').trim();
    if (!token || seen.has(token)) continue;
    seen.add(token);
    sum += scores.get(token) || 0;
  }
  return sum;
};

/**
 * @param {Object} trailer
 * @param {{ genres: Map<string, number>, countries: Map<string, number>, actors: Map<string, number> }} taste
 * @returns {number}
 */
const scoreTrailer = (trailer, taste) =>
  sumMatched(trailer?.filterGenre, taste.genres) +
  sumMatched(trailer?.filterCountry, taste.countries) +
  sumMatched(trailer?.actors, taste.actors);

/**
 * @param {Object} [taste]
 * @returns {{ genres: Map<string, number>, countries: Map<string, number>, actors: Map<string, number> }}
 */
const tasteMaps = (taste) => ({
  genres: scoreMap(taste?.genres, 'value'),
  countries: scoreMap(taste?.countries, 'value'),
  actors: scoreMap(taste?.actors, 'actorId'),
});

/**
 * Bitta treylerning yaqinligi.
 *
 * @param {Object} trailer
 * @param {Object} [taste]
 * @returns {number}
 */
const closenessScore = (trailer, taste) => scoreTrailer(trailer, tasteMaps(taste));

/**
 * Moslik yuqori bo‘lsa oldinda. Teng ballda kirish tartibi saqlanadi.
 * Kirish ro‘yxati o‘zgarmaydi.
 *
 * @param {Array<Object>} trailers
 * @param {Object} [taste]
 * @returns {Array<Object>}
 */
const orderByCloseness = (trailers, taste) => {
  const maps = tasteMaps(taste);
  return (trailers || [])
    .map((trailer) => ({
      ...trailer,
      closeness: scoreTrailer(trailer, maps),
    }))
    .sort((a, b) => b.closeness - a.closeness);
};

module.exports = {
  closenessScore,
  orderByCloseness,
};
