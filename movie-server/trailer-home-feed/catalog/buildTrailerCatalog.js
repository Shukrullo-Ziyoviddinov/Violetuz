'use strict';

const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');
const config = trailerHomeFeedWeights.catalog;

const positiveId = (value) => {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^\d+$/.test(value.trim())) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const token = (value) => typeof value === 'string' ? value.trim()
  : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';

const tokens = (value) => [...new Set((Array.isArray(value) ? value : [value]).map(token).filter(Boolean))];

const localized = (value) => {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([, entry]) => typeof entry === 'string' && entry.trim())
    .map(([language, entry]) => [language, entry.trim()]));
};

const hasVideo = (value) => typeof value === 'string' ? Boolean(value)
  : Object.values(value).some(Boolean);

const timestamp = (source, prefix) => {
  for (const field of config.uploadedAtFields) {
    const raw = source?.[field];
    if (!(raw instanceof Date) && !(typeof raw === 'string' && raw.trim())) continue;
    const ms = raw instanceof Date ? raw.getTime() : Date.parse(raw);
    if (Number.isFinite(ms)) return { value: new Date(ms).toISOString(), source: `${prefix}.${field}` };
  }
  return { value: null, source: null };
};

/** Pure catalog mapping. Input order is preserved; no ranking, filtering by channel or writes. */
const buildTrailerCatalog = (movies) => {
  const output = [];
  const seen = new Set();
  for (const rawMovie of Array.isArray(movies) ? movies : []) {
    const movie = typeof rawMovie?.toObject === 'function' ? rawMovie.toObject() : rawMovie;
    if (!movie || typeof movie !== 'object') continue;
    const fields = config.movieFields;
    const movieId = positiveId(movie[fields.id]);
    if (movieId == null) continue;
    const trailers = movie[config.trailersField];
    if (!Array.isArray(trailers)) continue;
    const movieTime = timestamp(movie, 'movie');

    trailers.forEach((rawTrailer, index) => {
      const trailer = typeof rawTrailer?.toObject === 'function' ? rawTrailer.toObject() : rawTrailer;
      if (!trailer || typeof trailer !== 'object' || Array.isArray(trailer)) return;
      const trailerId = positiveId(trailer[config.trailerFields.id]);
      if (trailerId == null) return;
      const key = `${movieId}-${trailerId}`;
      const video = localized(trailer[config.trailerFields.video]);
      if (seen.has(key) || !hasVideo(video)) return;
      seen.add(key);
      const trailerTime = timestamp(trailer, 'trailer');
      const uploadTime = trailerTime.value ? trailerTime : movieTime;

      output.push({
        key,
        movieId,
        trailerId,
        id: trailerId,
        trailerIndex: index + 1,
        movieTitle: localized(movie.title),
        title: localized(trailer[config.trailerFields.title]),
        trailers: video,
        trillerimg: token(trailer[config.trailerFields.image]) || token(movie.homeImg?.uz) || token(movie.homeImg?.ru),
        filterGenre: tokens(movie[fields.genres]),
        filterCountry: tokens(movie[fields.country]),
        actors: tokens(movie[fields.actors]),
        // Missing ownership stays null; do not invent a channel for diversity quotas.
        channelId: token(movie[fields.channel]) || null,
        uploadedAt: uploadTime.value,
        uploadTimeSource: uploadTime.source,
        trailerUploadedAt: trailerTime.value,
        movieUploadedAt: movieTime.value,
      });
    });
  }
  return output;
};

module.exports = { buildTrailerCatalog };
