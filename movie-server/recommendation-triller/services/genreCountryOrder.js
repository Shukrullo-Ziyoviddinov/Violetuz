/**
 * Janr va davlat tartibi. Sof hisob, bazaga yozmaydi.
 *
 * Yoqtirgan janr 80 foiz, deyarli ko‘rilmagan janr 20 foiz.
 * 20 foiz qator oxirida blok bo‘lib yotmaydi: oraliqda turadi.
 * 20 ta video bo‘lsa hammasi chiqadi. Video takrorlanmaydi.
 *
 * @module recommendation-triller/services/genreCountryOrder
 */

'use strict';

const { gapForRowLength } = require('./movieOrder');

const TOP_MATCHES = 2;

const asTokens = (value) => {
  const source = Array.isArray(value) ? value : value == null || value === '' ? [] : [value];
  const seen = new Set();
  const tokens = [];
  for (const item of source) {
    const token = String(item ?? '').trim();
    if (!token || seen.has(token)) continue;
    seen.add(token);
    tokens.push(token);
  }
  return tokens;
};

const scoreMapOf = (rows) => {
  const map = new Map();
  for (const row of rows || []) {
    const value = String(row?.value ?? '').trim();
    const score = Number(row?.score);
    if (!value || !Number.isFinite(score) || score <= 0) continue;
    map.set(value, (map.get(value) || 0) + score);
  }
  return map;
};

const topMatchScore = (tokens, scores) =>
  tokens
    .map((token) => scores.get(token) || 0)
    .filter((score) => score > 0)
    .sort((a, b) => b - a)
    .slice(0, TOP_MATCHES)
    .reduce((sum, score) => sum + score, 0);

const ratingOf = (video) => {
  const imdb = Number(video?.reytingImdb);
  const kinopoisk = Number(video?.reytingKinopoisk);
  const parts = [imdb, kinopoisk].filter((n) => Number.isFinite(n) && n > 0);
  if (!parts.length) return 0;
  return parts.reduce((sum, n) => sum + n, 0) / parts.length;
};

const passesAge = (video, userAge) => {
  if (userAge == null || userAge === '') return true;
  const age = Number(userAge);
  if (!Number.isFinite(age)) return true;
  const limit = Number(video?.ageLimit);
  if (!Number.isFinite(limit) || limit <= 0) return true;
  return age >= limit;
};

const uniqueVideos = (videos, excludeIds) => {
  const excluded = new Set((excludeIds || []).map((id) => String(id)));
  const seen = new Set();
  const list = [];
  for (const video of videos || []) {
    if (!video || video.id == null) continue;
    const key = String(video.id);
    if (excluded.has(key) || seen.has(key)) continue;
    seen.add(key);
    list.push(video);
  }
  return list;
};

/**
 * @param {Object} [input]
 * @param {Array<Object>} [input.videos]
 * @param {Array<{ value: string, score: number }>} [input.genres]
 * @param {Array<{ value: string, score: number }>} [input.countries]
 * @param {Array<{ value: string, score: number }>} [input.fillGenres]
 * @param {Array<{ value: string, score: number }>} [input.fillCountries]
 * @param {number} [input.rowLength]
 * @param {number} [input.userAge]
 * @param {Array<string|number>} [input.excludeIds]
 * @returns {{
 *   order: Object[],
 *   gap: number,
 *   tasteCount: number,
 *   otherCount: number
 * }}
 */
const orderGenreCountry = (input = {}) => {
  const genreScores = scoreMapOf(input.genres);
  const countryScores = scoreMapOf(input.countries);
  const fillGenreScores = scoreMapOf(input.fillGenres);
  const fillCountryScores = scoreMapOf(input.fillCountries);
  const hasFill = fillGenreScores.size > 0 || fillCountryScores.size > 0;
  const videos = uniqueVideos(input.videos, input.excludeIds).filter((video) =>
    passesAge(video, input.userAge)
  );
  const gap = gapForRowLength(input.rowLength != null ? input.rowLength : videos.length);

  const taste = [];
  const other = [];

  for (const video of videos) {
    const genres = asTokens(video.filterGenre);
    const countries = asTokens(video.filterCountry);
    const genreScore = topMatchScore(genres, genreScores);
    const countryScore = topMatchScore(countries, countryScores);
    const rating = ratingOf(video);
    if (genreScore > 0) {
      taste.push({ video, score: genreScore + countryScore, rating });
      continue;
    }
    const fillScore = hasFill
      ? topMatchScore(genres, fillGenreScores) + topMatchScore(countries, fillCountryScores)
      : countryScore;
    other.push({ video, score: fillScore, rating });
  }

  const byRank = (a, b) =>
    b.score - a.score || b.rating - a.rating || Number(a.video.id) - Number(b.video.id);
  taste.sort(byRank);
  other.sort(byRank);

  const total = taste.length + other.length;
  const order = [];
  let tasteIndex = 0;
  let otherIndex = 0;

  for (let index = 0; index < total; index += 1) {
    const otherSlot = gap > 0 && (index + 1) % gap === 0;
    if (otherSlot && otherIndex < other.length) {
      order.push(other[otherIndex].video);
      otherIndex += 1;
      continue;
    }
    if (tasteIndex < taste.length) {
      order.push(taste[tasteIndex].video);
      tasteIndex += 1;
      continue;
    }
    if (otherIndex < other.length) {
      order.push(other[otherIndex].video);
      otherIndex += 1;
    }
  }

  return {
    order,
    gap,
    tasteCount: taste.length,
    otherCount: other.length,
  };
};

module.exports = {
  orderGenreCountry,
};
