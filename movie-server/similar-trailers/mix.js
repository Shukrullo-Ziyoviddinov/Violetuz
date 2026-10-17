/**
 * Aralash tartib. Sof, bazaga yozmaydi.
 * Bitta janr, bitta davlat yoki bitta aktyor qatorni to‘ldirmaydi.
 * Boshqa mos treyler orada turadi. Hech biri o‘chmaydi.
 * Ko‘rilgan o‘xshash treyler ko‘rilmagan o‘xshashdan yuqoriga chiqmaydi.
 *
 * @module similar-trailers/mix
 */

'use strict';

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
const tokens = (raw) => {
  const list = Array.isArray(raw) ? raw : raw == null || raw === '' ? [] : [raw];
  const seen = new Set();
  /** @type {string[]} */
  const out = [];
  for (const item of list) {
    const token = String(item ?? '').trim();
    if (!token || seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out;
};

/**
 * @param {string[]} left
 * @param {string[]} right
 * @returns {boolean}
 */
const sameTokens = (left, right) => {
  if (left.length !== right.length) return false;
  const set = new Set(left);
  return right.every((token) => set.has(token));
};

/**
 * @param {{ genres: string[], countries: string[], actors: string[] }} previous
 * @param {{ genres: string[], countries: string[], actors: string[] }} candidate
 * @returns {boolean}
 */
const isDifferent = (previous, candidate) =>
  !sameTokens(previous.genres, candidate.genres) ||
  !sameTokens(previous.countries, candidate.countries) ||
  !sameTokens(previous.actors, candidate.actors);

/**
 * @param {Object} trailer
 * @returns {{ genres: string[], countries: string[], actors: string[] }}
 */
const keysOf = (trailer) => ({
  genres: tokens(trailer?.filterGenre),
  countries: tokens(trailer?.filterCountry),
  actors: tokens(trailer?.actors),
});

/**
 * @param {Array<{ trailer: Object, keys: { genres: string[], countries: string[], actors: string[] } }>} band
 * @returns {Array<Object>}
 */
const mixBand = (band) => {
  const remaining = band.slice();
  /** @type {Array<Object>} */
  const selected = [];

  while (remaining.length) {
    let index = 0;
    const previous = selected.length ? keysOf(selected[selected.length - 1]) : null;
    if (previous) {
      const differentAt = remaining.findIndex((item) => isDifferent(previous, item.keys));
      if (differentAt >= 0) index = differentAt;
    }
    const [picked] = remaining.splice(index, 1);
    selected.push(picked.trailer);
  }

  return selected;
};

/**
 * @param {Array<Object>} trailers
 * @param {Array<number|string>} [watchedMovieIds]
 * @returns {Array<Object>}
 */
const mixTrailers = (trailers, watchedMovieIds) => {
  const watched = new Set((watchedMovieIds || []).map((id) => String(id)));
  /** @type {Array<{ trailer: Object, keys: { genres: string[], countries: string[], actors: string[] } }>} */
  const unwatchedSimilar = [];
  /** @type {Array<{ trailer: Object, keys: { genres: string[], countries: string[], actors: string[] } }>} */
  const watchedSimilar = [];
  /** @type {Array<{ trailer: Object, keys: { genres: string[], countries: string[], actors: string[] } }>} */
  const rest = [];

  for (const trailer of trailers || []) {
    const item = { trailer, keys: keysOf(trailer) };
    const closeness = Number(trailer?.closeness);
    const similar = Number.isFinite(closeness) && closeness > 0;
    const seen = watched.has(String(trailer?.movieId));
    if (similar && !seen) unwatchedSimilar.push(item);
    else if (similar && seen) watchedSimilar.push(item);
    else rest.push(item);
  }

  return [...mixBand(unwatchedSimilar), ...mixBand(watchedSimilar), ...mixBand(rest)].map(
    (trailer) => ({ ...trailer })
  );
};

module.exports = {
  mixTrailers,
};
