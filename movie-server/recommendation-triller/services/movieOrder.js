/**
 * Kino videolarining tartibi. Sof hisob, bazaga yozmaydi.
 *
 * 1-o‘rin: eng yangi ko‘rilgan kinoning asosiy videosi.
 * 2-o‘rin: undan oldingi kinoning asosiy videosi.
 * Kam foiz yuqorida. Hammasi to‘liq ko‘rilsa, birinchi biriktirilgan yana 1-o‘rin.
 * Qolgan videolar oraliq bilan turadi, yonma-yon emas.
 *
 * @module recommendation-triller/services/movieOrder
 */

'use strict';

const SEAT_COUNT = 2;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SEAT_MAX_AGE_MS = 7 * DAY_MS;
const COMPLETE_AT = 1 - 1e-6;

/**
 * Qator uzunligining choragi. 40 tadan keyin 6.
 *
 * @param {number} rowLength
 * @returns {number}
 */
const gapForRowLength = (rowLength) => {
  const count = Number(rowLength);
  if (!Number.isFinite(count) || count <= 1) return 2;
  if (count >= 40) return 6;
  return Math.max(2, Math.round(count / 4));
};

const completionOf = (completionById, videoId) => {
  const rate = Number(completionById?.[videoId] ?? completionById?.[String(videoId)]);
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return Math.min(1, rate);
};

const orderRank = (video) => {
  const order = Number(video?.franchiseOrder);
  if (!Number.isInteger(order) || order <= 0) return Number.POSITIVE_INFINITY;
  return order;
};

const isComplete = (rate) => rate >= COMPLETE_AT;

/**
 * Bitta kinoning videolari.
 * Kam foiz oldinda. Foiz teng bo‘lsa, oldinroq biriktirilgan oldinda.
 * Hammasi to‘liq bo‘lsa, biriktirish tartibi: 1, 2, 3.
 *
 * @param {Array<{ id: *, franchiseOrder?: number }>} videos
 * @param {Object.<string|number, number>} completionById
 */
const orderMovieVideos = (videos, completionById) => {
  const list = Array.isArray(videos) ? videos.filter((video) => video && video.id != null) : [];
  const allComplete = list.length > 0 && list.every((video) => isComplete(completionOf(completionById, video.id)));

  return [...list].sort((a, b) => {
    if (!allComplete) {
      const rateDelta = completionOf(completionById, a.id) - completionOf(completionById, b.id);
      if (rateDelta !== 0) return rateDelta;
    }
    const orderDelta = orderRank(a) - orderRank(b);
    if (orderDelta !== 0) return orderDelta;
    return Number(a.id) - Number(b.id);
  });
};

const videosForMovie = (videos, movieId) => {
  const id = Number(movieId);
  if (!Number.isInteger(id) || id <= 0) return [];
  return (videos || []).filter((video) => Number(video?.franchiseMovieId) === id);
};

/**
 * @param {Array<{ movieId: number, watchedAt?: number|string|Date }>} recentMovies
 * @param {number} [nowMs]
 * @param {number} [maxAgeMs]
 */
const freshMovieIds = (recentMovies, nowMs, maxAgeMs) => {
  const ranked = (Array.isArray(recentMovies) ? recentMovies : [])
    .map((row) => {
      const movieId = Number(row?.movieId ?? row);
      const watchedAt = row?.watchedAt == null ? nowMs : new Date(row.watchedAt).getTime();
      return { movieId, watchedAt };
    })
    .filter((row) => Number.isInteger(row.movieId) && row.movieId > 0 && Number.isFinite(row.watchedAt))
    .filter((row) => nowMs - row.watchedAt <= maxAgeMs)
    .sort((a, b) => b.watchedAt - a.watchedAt || b.movieId - a.movieId);

  const seen = new Set();
  const ids = [];
  for (const row of ranked) {
    if (seen.has(row.movieId)) continue;
    seen.add(row.movieId);
    ids.push(row.movieId);
  }
  return ids;
};

/**
 * @param {Object} [input]
 * @param {Array<{ id: *, franchiseMovieId?: number|null, franchiseOrder?: number|null }>} [input.videos]
 * @param {Object.<string|number, number>} [input.completionById]
 * @param {Array<{ movieId: number, watchedAt?: number|string|Date }|number>} [input.recentMovies]
 * @param {number} [input.rowLength]
 * @param {number} [input.nowMs]
 * @param {number} [input.seatMaxAgeMs]
 * @returns {{
 *   seats: Array<Object|null>,
 *   extras: Array<{ video: Object, at: number }>,
 *   gap: number
 * }}
 */
const orderFranchiseVideos = (input = {}) => {
  const videos = Array.isArray(input.videos) ? input.videos : [];
  const completionById = input.completionById || {};
  const nowMs = Number.isFinite(Number(input.nowMs)) ? Number(input.nowMs) : Date.now();
  const maxAgeMs = Number.isFinite(Number(input.seatMaxAgeMs))
    ? Number(input.seatMaxAgeMs)
    : DEFAULT_SEAT_MAX_AGE_MS;
  const gap = gapForRowLength(input.rowLength != null ? input.rowLength : videos.length);

  const seats = Array.from({ length: SEAT_COUNT }, () => null);
  /** @type {Array<Object>} */
  const extras = [];
  let placed = 0;

  for (const movieId of freshMovieIds(input.recentMovies, nowMs, maxAgeMs)) {
    if (placed >= SEAT_COUNT) break;
    const ordered = orderMovieVideos(videosForMovie(videos, movieId), completionById);
    if (!ordered.length) continue;
    seats[placed] = ordered[0];
    extras.push(...ordered.slice(1));
    placed += 1;
  }

  const used = new Set(seats.filter(Boolean).map((video) => video.id));
  let cursor = seats.filter(Boolean).length - 1;
  /** @type {Array<{ video: Object, at: number }>} */
  const spaced = [];

  for (const video of extras) {
    if (video == null || used.has(video.id)) continue;
    const at = cursor < 0 ? 0 : cursor + gap;
    spaced.push({ video, at });
    used.add(video.id);
    cursor = at;
  }

  return { seats, extras: spaced, gap };
};

module.exports = {
  SEAT_COUNT,
  DEFAULT_SEAT_MAX_AGE_MS,
  gapForRowLength,
  orderMovieVideos,
  orderFranchiseVideos,
};
