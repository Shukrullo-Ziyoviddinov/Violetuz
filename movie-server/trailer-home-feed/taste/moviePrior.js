'use strict';
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');
const { DIMENSIONS, dimensionValues, emptyDimensions, rankedDimensions, timestamp, decay } = require('./dimensions');

const SOURCE_TYPES = { genre: 'genre', country: 'country', actor: 'actor', genre_country: 'genreCountry', genre_actor: 'genreActor' };
const buildMoviePrior = ({ affinities = [], progress = [], likes = [], nowMs }) => {
  const config = trailerHomeFeedWeights.personalization;
  const prior = config.movieTastePrior;
  const cutoff = nowMs - config.historyMaxAgeDays * 86400_000;
  const validTime = (raw) => { const at = timestamp(raw); return at != null && at >= cutoff && at <= nowMs ? at : null; };
  const quality = new Map();
  const credit = (id, at) => {
    if (!/^\d+$/.test(String(id)) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0 || at == null) return;
    quality.set(String(Number(id)), Math.max(quality.get(String(Number(id))) || 0, decay(at, nowMs, prior.halfLifeDays)));
  };
  for (const row of progress) {
    if (Number.isFinite(row.watchedSeconds) && row.watchedSeconds >= prior.minWatchedSeconds
      && Number.isFinite(row.completionRate) && row.completionRate >= prior.minCompletion) credit(row.movieId, validTime(row.updatedAt));
  }
  for (const row of likes) if (row.type === 'movie' && row.value === 'like') credit(row.targetId, validTime(row.updatedAt));
  const maps = emptyDimensions();
  for (const row of affinities) {
    const dimension = SOURCE_TYPES[row.dimensionType];
    const at = validTime(row.updatedAt);
    if (!dimension || at == null || !Number.isFinite(row.affinityScore) || row.affinityScore <= 0) continue;
    let value = typeof row.dimensionValue === 'string' ? row.dimensionValue.trim() : '';
    if (dimension === 'genreCountry' || dimension === 'genreActor') {
      const parts = value.split('::');
      if (parts.length !== 2 || parts.some((part) => !part.trim())) continue;
      value = JSON.stringify(dimension === 'genreCountry' ? [parts[1].trim(), parts[0].trim()] : parts.map((part) => part.trim()));
    }
    if (!value) continue;
    const score = Math.min(config.maxAffinityPerValue, row.affinityScore) / config.maxAffinityPerValue * decay(at, nowMs, prior.halfLifeDays);
    maps[dimension].set(value, Math.max(maps[dimension].get(value) || 0, score));
  }
  const effectiveQualityMovies = [...quality.values()].reduce((sum, value) => sum + value, 0);
  return { dimensions: rankedDimensions(maps), distinctQualityMovies: quality.size, effectiveQualityMovies,
    confidence: prior.enabled ? Math.min(1, effectiveQualityMovies / prior.confidenceThreshold) : 0 };
};

// Guest movie history is private personalization input only; never imported or used as global trend evidence.
const buildGuestMoviePrior = ({ history, movies, nowMs }) => {
  const policy = trailerHomeFeedWeights.personalization;
  if (!Array.isArray(history) || history.length > policy.maxGuestMovieHistory) throw new TypeError('Invalid guest movie history');
  const byId = new Map(movies.map((movie) => [String(movie.id), movie]));
  const newest = new Map();
  for (const raw of history) {
    const id = raw?.m ?? raw?.movieId;
    const ratio = raw?.r ?? raw?.completionRate;
    const at = timestamp(raw?.t ?? raw?.updatedAt);
    if (!/^\d+$/.test(String(id)) || !byId.has(String(Number(id))) || !Number.isFinite(ratio)
      || ratio < policy.movieTastePrior.minCompletion || ratio > 1 || at == null || at > nowMs
      || at < nowMs - policy.historyMaxAgeDays * 86400_000) continue;
    if (raw.watchedSeconds != null && (!Number.isFinite(raw.watchedSeconds) || raw.watchedSeconds < policy.movieTastePrior.minWatchedSeconds)) continue;
    if (!newest.has(String(Number(id))) || newest.get(String(Number(id))).at < at) newest.set(String(Number(id)), { at, movie: byId.get(String(Number(id))) });
  }
  const maps = emptyDimensions();
  for (const { movie, at } of newest.values()) {
    const dimensions = dimensionValues(movie);
    for (const dimension of DIMENSIONS) for (const value of dimensions[dimension]) {
      const amount = decay(at, nowMs, policy.movieTastePrior.halfLifeDays) / dimensions[dimension].length;
      maps[dimension].set(value, Math.min(policy.maxAffinityPerValue, (maps[dimension].get(value) || 0) + amount));
    }
  }
  const effectiveQualityMovies = [...newest.values()].reduce((sum, row) => sum + decay(row.at, nowMs, policy.movieTastePrior.halfLifeDays), 0);
  for (const dimension of DIMENSIONS) for (const [value, amount] of maps[dimension]) maps[dimension].set(value, amount / policy.maxAffinityPerValue);
  return { dimensions: rankedDimensions(maps), distinctQualityMovies: newest.size, effectiveQualityMovies,
    confidence: Math.min(1, effectiveQualityMovies / policy.movieTastePrior.confidenceThreshold) };
};

module.exports = { buildMoviePrior, buildGuestMoviePrior };
