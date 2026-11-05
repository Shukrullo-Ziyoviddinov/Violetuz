'use strict';
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');
const { collectTrailerEvidence } = require('./trailerEvidence');
const { DIMENSIONS, dimensionValues, emptyDimensions, rankedDimensions } = require('./dimensions');

const buildPersonalTaste = ({ catalog, sessions = [], actions = [], reactions = [], moviePrior = null, nowMs = Date.now() }) => {
  if (!Number.isFinite(nowMs)) throw new TypeError('Invalid taste clock');
  const config = trailerHomeFeedWeights.personalization;
  const evidence = collectTrailerEvidence({ catalog, sessions, actions, reactions, nowMs });
  const byKey = new Map(catalog.map((row) => [row.key, row]));
  const movies = new Map();
  for (const item of evidence) {
    if (item.positiveScore <= 0) continue;
    const old = movies.get(item.movieId);
    if (!old || item.positiveScore > old.score) movies.set(item.movieId, { item: byKey.get(item.key), score: Math.min(config.maxPositivePerMovie, item.positiveScore) });
  }
  const maps = emptyDimensions();
  for (const { item, score } of movies.values()) {
    const values = dimensionValues(item);
    for (const dimension of DIMENSIONS) for (const value of values[dimension]) {
      const amount = score / values[dimension].length;
      maps[dimension].set(value, Math.min(config.maxAffinityPerValue, (maps[dimension].get(value) || 0) + amount));
    }
  }
  for (const dimension of DIMENSIONS) for (const [value, amount] of maps[dimension]) maps[dimension].set(value, amount / config.maxAffinityPerValue);
  const trailerDimensions = rankedDimensions(maps);
  const effectiveMeaningfulTrailers = evidence.reduce((sum, row) => sum + row.meaningfulConfidence, 0);
  const fullConfidenceCount = config.confidenceAnchors[config.confidenceAnchors.length - 1].count;
  const trailerConfidence = Math.min(1, effectiveMeaningfulTrailers / fullConfidenceCount);
  const hasMoviePrior = DIMENSIONS.some((dimension) => (moviePrior?.dimensions?.[dimension] || []).some((row) => Number.isFinite(row.score) && row.score > 0));
  const movieConfidence = config.movieTastePrior.enabled && hasMoviePrior && Number.isFinite(moviePrior?.confidence) ? Math.min(1, Math.max(0, moviePrior.confidence)) : 0;
  const movieShare = config.movieTastePrior.maxShareOfPersonalScore * movieConfidence * (1 - trailerConfidence);
  const combined = emptyDimensions();
  for (const dimension of DIMENSIONS) {
    for (const row of trailerDimensions[dimension]) combined[dimension].set(row.value, row.score * (1 - movieShare));
    for (const row of moviePrior?.dimensions?.[dimension] || []) {
      if (!Number.isFinite(row.score) || row.score <= 0 || typeof row.value !== 'string') continue;
      combined[dimension].set(row.value, Math.min(1, (combined[dimension].get(row.value) || 0) + Math.min(1, row.score) * movieShare));
    }
  }
  const dimensions = rankedDimensions(combined);
  return {
    dimensions, trailerDimensions,
    confidence: { trailer: trailerConfidence, moviePrior: movieConfidence, combined: Math.min(1, trailerConfidence + movieShare) },
    sourceShares: { trailer: 1 - movieShare, moviePrior: movieShare },
    distinctMeaningfulTrailers: evidence.filter((row) => row.meaningfulConfidence > 0).length,
    effectiveMeaningfulTrailers, positiveMovies: movies.size,
    hasPersonalTaste: DIMENSIONS.some((dimension) => dimensions[dimension].some((row) => row.score > 0)),
    excludedTrailerKeys: evidence.filter((row) => row.excluded).map((row) => row.key).sort(),
  };
};

// Matching helper only: retrieval, source mixing and channel re-ranking are later stages.
const scoreTrailerTaste = (trailer, profile) => {
  const values = dimensionValues(trailer);
  const weights = trailerHomeFeedWeights.personalization.affinityWeights;
  let score = 0;
  let totalWeight = 0;
  const parts = {};
  for (const dimension of DIMENSIONS) {
    const affinity = new Map((profile.dimensions?.[dimension] || []).map((row) => [row.value, row.score]));
    const average = values[dimension].length ? values[dimension].reduce((sum, value) => sum + (affinity.get(value) || 0), 0) / values[dimension].length : 0;
    parts[dimension] = average;
    score += weights[dimension] * average;
    totalWeight += weights[dimension];
  }
  return { score: profile.excludedTrailerKeys?.includes(trailer.key) ? 0 : Math.min(1, Math.max(0, score / totalWeight)), parts };
};

module.exports = { buildPersonalTaste, scoreTrailerTaste };
