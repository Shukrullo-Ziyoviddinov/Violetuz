'use strict';
const { sourceTypes, trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');
const { validateCandidateContext } = require('../candidates/buildCandidatePools');
const { createTieBreaker } = require('../candidates/channelPool');
const { dimensionValues } = require('../taste/dimensions');
const { sourceSharesForProfile, availableShares } = require('./sourceShares');

const violations = (item, selected, config) => {
  const historySize = Math.max(0, config.windowSize - 1);
  const window = historySize ? selected.slice(-historySize) : [];
  const result = [];
  const channel = item.channelId || null;
  if (config.avoidAdjacentSameChannel && selected.length && (selected[selected.length - 1].channelId || null) === channel) result.push('adjacentChannel');
  if (window.filter((row) => (row.channelId || null) === channel).length >= config.maxPerChannelInWindow) result.push('channel');
  if (window.filter((row) => row.movieId === item.movieId).length >= config.maxPerMovieInWindow) result.push('movie');
  const values = dimensionValues(item);
  const existing = window.map(dimensionValues);
  for (const [name, limit] of [['genre', config.maxPerGenreInWindow], ['country', config.maxPerCountryInWindow], ['actor', config.maxPerActorInWindow]]) {
    if (values[name].some((value) => existing.filter((row) => row[name].includes(value)).length >= limit)) result.push(name);
  }
  return result;
};

/** Deterministic quota/constraint ranking, not a running additive interest counter. */
const rankTrailerCandidates = ({ candidateSnapshot, profile = null, repetitionState = {}, sessionSeed,
  nowMs = Date.now(), limit = trailerHomeFeedWeights.feed.size, previousItems = [] }) => {
  validateCandidateContext({ sessionSeed, nowMs });
  const config = trailerHomeFeedWeights;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > config.feed.size) throw new TypeError('Invalid trailer feed size');
  if (!Array.isArray(candidateSnapshot?.candidates)) throw new TypeError('Candidate snapshot required');
  const tie = createTieBreaker(sessionSeed);
  const excluded = new Set([...(profile?.excludedTrailerKeys || []), ...(repetitionState.hardExcludedKeys || [])]);
  const canonical = new Map();
  for (const row of candidateSnapshot.candidates) {
    if (!row || row.key !== `${row.movieId}-${row.trailerId}` || !Number.isSafeInteger(row.movieId) || row.movieId <= 0
      || !Number.isSafeInteger(row.trailerId) || row.trailerId <= 0 || excluded.has(row.key) || canonical.has(row.key)) continue;
    canonical.set(row.key, { ...row, channelId: row.channelId || null });
  }
  const impressions = new Map((repetitionState.impressions || []).filter((row) => Number.isSafeInteger(row.count) && row.count >= 0).map((row) => [row.key, row.count]));
  const penalty = (key) => {
    const count = impressions.get(key) || 0;
    return Math.min(1, count / config.repetition.maxImpressionsPerViewerTrailer) * config.repetition.repeatedImpressionPenalty;
  };
  const pools = {};
  for (const source of sourceTypes) {
    const seen = new Set();
    pools[source] = (candidateSnapshot.pools?.[source] || []).flatMap((entry, index) => {
      if (!entry || !canonical.has(entry.key) || seen.has(entry.key) || !Number.isFinite(entry.score) || entry.score < 0 || entry.score > 1) return [];
      if (source === 'personal' && !profile?.hasPersonalTaste) return [];
      seen.add(entry.key);
      return [{ ...entry, index, penalty: penalty(entry.key), effectiveScore: entry.score * (1 - penalty(entry.key)) }];
    }).sort((a, b) => b.effectiveScore - a.effectiveScore || a.penalty - b.penalty || a.index - b.index);
  }
  const requested = sourceSharesForProfile(profile);
  const initialAvailability = Object.fromEntries(sourceTypes.map((source) => [source, pools[source].length > 0]));
  const targetShares = availableShares(requested.shares, initialAvailability);
  const selected = [];
  const picked = new Set();
  const sourceCounts = Object.fromEntries(sourceTypes.map((source) => [source, 0]));
  const relaxations = Object.fromEntries(config.diversity.relaxationOrder.map((name) => [name, 0]));
  while (selected.length < limit) {
    const relaxed = new Set();
    let choices = null;
    for (let level = 0; level <= config.diversity.relaxationOrder.length; level += 1) {
      const valid = {};
      for (const source of sourceTypes) {
        valid[source] = pools[source].find((row) => !picked.has(row.key)
          && violations(canonical.get(row.key), [...previousItems, ...selected], config.diversity).every((name) => relaxed.has(name)));
      }
      if (sourceTypes.some((source) => valid[source])) { choices = valid; break; }
      if (level < config.diversity.relaxationOrder.length) relaxed.add(config.diversity.relaxationOrder[level]);
    }
    if (!choices) break;
    const shares = availableShares(requested.shares, Object.fromEntries(sourceTypes.map((source) => [source, Boolean(choices[source])])));
    const available = sourceTypes.filter((source) => choices[source]);
    available.sort((a, b) => {
      const deficitA = shares[a] * (selected.length + 1) - sourceCounts[a];
      const deficitB = shares[b] * (selected.length + 1) - sourceCounts[b];
      return deficitB - deficitA || tie(`slot:${selected.length}`, a).localeCompare(tie(`slot:${selected.length}`, b));
    });
    const source = available[0];
    const row = choices[source];
    const item = canonical.get(row.key);
    const relaxedConstraints = violations(item, [...previousItems, ...selected], config.diversity);
    relaxedConstraints.forEach((name) => { relaxations[name] += 1; });
    selected.push({ ...item, position: selected.length + 1, assignedSource: source,
      sourceScore: row.score, effectiveSourceScore: row.effectiveScore, relaxedConstraints });
    picked.add(row.key);
    sourceCounts[source] += 1;
  }
  return {
    generatedAt: new Date(nowMs).toISOString(), items: selected,
    experience: requested.experience, requestedShares: requested.shares, targetShares, sourceCounts,
    realizedShares: Object.fromEntries(sourceTypes.map((source) => [source, selected.length ? sourceCounts[source] / selected.length : 0])),
    relaxations, eligibleCandidates: canonical.size, returned: selected.length,
  };
};

module.exports = { rankTrailerCandidates };
