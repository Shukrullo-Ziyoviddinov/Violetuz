/**
 * Olomon ulushi. Sof hisob, bazaga yozmaydi.
 *
 * 0 kino: hammasi olomon.
 * 1: 1-o‘rin shaxsiy, qolgani olomon.
 * 2–3: yarmi.
 * 4–5: olomon faqat bo‘sh joyni to‘ldiradi.
 * 6 va undan ko‘p: olomon chaqirilmaydi va qaytmaydi.
 * 5 daqiqadan qisqa ko‘rish hisobga kirmaydi.
 *
 * @module recommendation-triller/services/crowdFade
 */

'use strict';

const { scoringWeights } = require('../../recommendation/config/scoringWeights');

const MIN_WATCHED_SECONDS = scoringWeights.progress?.minWatchedSeconds ?? 300;
const CROWD_STOP_AT = 6;

/**
 * @param {number} watchedSeconds
 * @returns {boolean}
 */
const isQualityWatch = (watchedSeconds) => {
  const seconds = Number(watchedSeconds);
  return Number.isFinite(seconds) && seconds >= MIN_WATCHED_SECONDS;
};

/**
 * Turli kinolar. Sekund berilgan va 5 daqiqadan qisqa bo‘lsa, tushadi.
 * Sekund yo‘q bo‘lsa, yozuv allaqachon sifatli deb hisoblanadi.
 *
 * @param {Array<Object>} events
 * @returns {number}
 */
const countQualityMovies = (events) => {
  const ids = new Set();
  for (const event of events || []) {
    const movieId = event?.m ?? event?.movieId ?? event?.id;
    if (movieId == null || movieId === '') continue;
    const seconds = event?.watchedSeconds ?? event?.s;
    if (seconds != null && seconds !== '' && !isQualityWatch(seconds)) continue;
    ids.add(String(movieId));
  }
  return ids.size;
};

/**
 * @param {number} watchedMovieCount
 * @returns {{
 *   watchedMovieCount: number,
 *   callCrowd: boolean,
 *   mode: 'all'|'rest'|'half'|'gaps'|'personal',
 *   crowdShare: number
 * }}
 */
const crowdFade = (watchedMovieCount) => {
  const count = Math.max(0, Math.floor(Number(watchedMovieCount) || 0));

  if (count <= 0) {
    return { watchedMovieCount: 0, callCrowd: true, mode: 'all', crowdShare: 1 };
  }
  if (count === 1) {
    return { watchedMovieCount: 1, callCrowd: true, mode: 'rest', crowdShare: 1 };
  }
  if (count <= 3) {
    return { watchedMovieCount: count, callCrowd: true, mode: 'half', crowdShare: 0.5 };
  }
  if (count <= 5) {
    return { watchedMovieCount: count, callCrowd: true, mode: 'gaps', crowdShare: 0 };
  }
  return { watchedMovieCount: count, callCrowd: false, mode: 'personal', crowdShare: 0 };
};

const rowKey = (row, key) => String(row?.[key] ?? '').trim();

const normalizeRows = (rows, key) => {
  const list = (rows || []).filter((row) => rowKey(row, key) && Number(row.score) > 0);
  const max = list.reduce((peak, row) => Math.max(peak, Number(row.score) || 0), 0);
  if (max <= 0) return [];
  return list.map((row) => ({
    ...row,
    [key]: rowKey(row, key),
    score: (Number(row.score) || 0) / max,
  }));
};

/**
 * Ikki ro‘yxatni ulush bilan qo‘shadi. Bazaga yozmaydi.
 *
 * @param {Array<Object>} personal
 * @param {Array<Object>} crowd
 * @param {number} crowdShare
 * @param {string} key
 */
const blendScoreRows = (personal, crowd, crowdShare, key) => {
  const share = Math.min(1, Math.max(0, Number(crowdShare) || 0));
  /** @type {Map<string, number>} */
  const scores = new Map();
  const add = (rows, weight) => {
    if (weight <= 0) return;
    for (const row of normalizeRows(rows, key)) {
      const id = rowKey(row, key);
      scores.set(id, (scores.get(id) || 0) + row.score * weight);
    }
  };

  add(personal, 1 - share);
  add(crowd, share);

  return [...scores.entries()]
    .map(([id, score]) => ({ [key]: id, score }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || String(a[key]).localeCompare(String(b[key])));
};

module.exports = {
  MIN_WATCHED_SECONDS,
  CROWD_STOP_AT,
  isQualityWatch,
  countQualityMovies,
  crowdFade,
  blendScoreRows,
};
