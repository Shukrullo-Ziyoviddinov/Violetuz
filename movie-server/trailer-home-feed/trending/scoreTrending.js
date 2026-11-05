'use strict';
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');
const { signalDay } = require('../signals/signalProtocol');

const RATE_PARTS = ['coverage', 'completion', 'likes', 'movieOpens', 'dislikes'];
const empty = () => ({ mass: 0, coverage: 0, completion: 0, likes: 0, movieOpens: 0, dislikes: 0,
  viewers: new Map(), meaningfulViewers: new Map(), observationCount: 0, impressionCount: 0 });

/** Pure scoring. No min-max normalization: one lucky sample must not turn into score 1. */
const scoreTrailerTrending = ({ catalog, observations, nowMs = Date.now() }) => {
  if (!Number.isFinite(nowMs)) throw new TypeError('Invalid trend clock');
  const config = trailerHomeFeedWeights.trending;
  const fromMs = nowMs - config.windowDays * 86400_000;
  const stats = new Map(catalog.map((row) => [row.key, empty()]));
  const seen = new Set();
  const ordered = [...observations].sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
  for (const observation of ordered) {
    const at = Date.parse(observation.occurredAt);
    if (!Number.isFinite(at) || at < fromMs || at > nowMs || !stats.has(observation.key)
      || typeof observation.viewerKey !== 'string' || !/^(account|guest):.+/.test(observation.viewerKey)
      || observation.day !== signalDay(at) || !Number.isFinite(observation.coverage)
      || observation.coverage < 0 || observation.coverage > 1) continue;
    const identity = JSON.stringify([observation.key, observation.viewerKey, observation.day]);
    if (seen.has(identity)) continue;
    seen.add(identity);
    const row = stats.get(observation.key);
    const weight = Math.min(1, config.maxContributionPerViewerTrailerDay) * 2 ** (-(nowMs - at) / (config.halfLifeHours * 3600_000));
    row.mass += weight;
    row.observationCount += 1;
    row.impressionCount += observation.impression === true ? 1 : 0;
    row.coverage += weight * observation.coverage;
    row.completion += observation.completed === true ? weight : 0;
    row.likes += observation.liked === true ? weight : 0;
    row.dislikes += observation.disliked === true ? weight : 0;
    row.movieOpens += observation.openedMovie === true ? weight : 0;
    row.viewers.set(observation.viewerKey, Math.max(row.viewers.get(observation.viewerKey) || 0, weight));
    if (observation.meaningfulWatch === true) row.meaningfulViewers.set(observation.viewerKey, Math.max(row.meaningfulViewers.get(observation.viewerKey) || 0, weight));
  }
  const totals = { mass: 0, ...Object.fromEntries(RATE_PARTS.map((part) => [part, 0])) };
  for (const row of stats.values()) {
    totals.mass += row.mass;
    RATE_PARTS.forEach((part) => { totals[part] += row[part]; });
  }
  return catalog.map((trailer) => {
    const row = stats.get(trailer.key);
    const distinctMass = [...row.viewers.values()].reduce((sum, weight) => sum + weight, 0);
    const meaningfulMass = [...row.meaningfulViewers.values()].reduce((sum, weight) => sum + weight, 0);
    const evidenceConfidence = distinctMass / (distinctMass + config.priorSampleSize);
    const priors = {};
    const rates = {};
    RATE_PARTS.forEach((part) => {
      // All candidates use the same observed prior. Candidate-specific priors can
      // invert conversion ordering when two equally exposed trailers are compared.
      priors[part] = totals.mass > 1e-9 ? totals[part] / totals.mass : null;
      rates[part] = row.mass <= 0 ? null : priors[part] == null ? row[part] / row.mass
        : (row[part] + config.priorSampleSize * priors[part]) / (row.mass + config.priorSampleSize);
    });
    const parts = {
      uniqueMeaningfulViewers: meaningfulMass / (distinctMass + config.priorSampleSize),
      coverage: rates.coverage, completion: rates.completion, likes: rates.likes, movieOpens: rates.movieOpens,
    };
    const hasPositiveEvidence = row.coverage > 0 || row.likes > 0 || row.movieOpens > 0;
    const eligible = row.viewers.size >= config.minDistinctViewers && row.meaningfulViewers.size >= config.minMeaningfulViewers;
    const positive = Object.entries(config.weights).reduce((sum, [part, weight]) => sum + weight * (parts[part] ?? 0), 0);
    const score = eligible && hasPositiveEvidence
      ? Math.min(1, Math.max(0, positive - config.dislikePenalty * (rates.dislikes ?? 0)) * evidenceConfidence) : 0;
    return {
      key: trailer.key, movieId: trailer.movieId, trailerId: trailer.trailerId, channelId: trailer.channelId,
      score, eligible, distinctViewers: row.viewers.size, distinctMeaningfulViewers: row.meaningfulViewers.size,
      viewerDays: row.observationCount, impressionViewerDays: row.impressionCount,
      effectiveViewerMass: distinctMass, evidenceConfidence, parts, priors,
    };
  }).sort((a, b) => b.score - a.score || a.movieId - b.movieId || a.trailerId - b.trailerId);
};

module.exports = { scoreTrailerTrending };
