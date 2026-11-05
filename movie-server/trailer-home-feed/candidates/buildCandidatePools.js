'use strict';
const { sourceTypes, trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');
const { scoreTrailerTaste } = require('../taste/buildPersonalTaste');
const { createTieBreaker, selectAcrossChannels } = require('./channelPool');

const time = (raw) => {
  if (typeof raw !== 'string' && !(raw instanceof Date)) return null;
  const result = raw instanceof Date ? raw.getTime() : Date.parse(raw);
  return Number.isFinite(result) ? result : null;
};
const validSnapshot = (snapshot, nowMs, maxAge) => {
  const generated = time(snapshot?.generatedAt);
  return generated != null && generated <= nowMs && nowMs - generated <= maxAge;
};

const validateCandidateContext = ({ sessionSeed, nowMs }) => {
  if (!Number.isFinite(nowMs) || typeof sessionSeed !== 'string' || !/^[a-zA-Z0-9_-]{16,128}$/.test(sessionSeed)) {
    throw new TypeError('A valid clock and stable server-owned session seed are required');
  }
};

/** Source retrieval only. Returned order is NOT the final recommendation ranking. */
const buildCandidatePools = ({ catalog, profile = null, trendSnapshot = null, exposureSnapshot = null,
  sessionSeed, nowMs = Date.now(), excludeKeys = [] }) => {
  validateCandidateContext({ sessionSeed, nowMs });
  if (!Array.isArray(catalog) || !Array.isArray(excludeKeys)) throw new TypeError('Catalog and exclusions must be arrays');
  const config = trailerHomeFeedWeights;
  const tie = createTieBreaker(sessionSeed);
  const all = new Map();
  for (const row of catalog) {
    if (!row || !Number.isSafeInteger(row.movieId) || row.movieId <= 0 || !Number.isSafeInteger(row.trailerId) || row.trailerId <= 0
      || row.key !== `${row.movieId}-${row.trailerId}` || all.has(row.key)) continue;
    all.set(row.key, { ...row, channelId: row.channelId == null || row.channelId === '' ? null : String(row.channelId) });
  }
  const blocked = new Set([...excludeKeys, ...(profile?.excludedTrailerKeys || [])]);
  const eligible = [...all.values()].filter((row) => !blocked.has(row.key));
  const trendAvailable = Array.isArray(trendSnapshot?.trailers) && validSnapshot(trendSnapshot, nowMs, config.candidates.trendingMaxAgeMs);
  let exposureAvailable = exposureSnapshot?.available === true && Array.isArray(exposureSnapshot.rows)
    && validSnapshot(exposureSnapshot, nowMs, config.candidates.exploration.exposureMaxAgeMs);
  const trends = new Map();
  if (trendAvailable) for (const row of trendSnapshot.trailers) {
    if (!row || !all.has(row.key) || row.eligible !== true || !Number.isFinite(row.score) || row.score <= 0 || row.score > 1) continue;
    if (!trends.has(row.key) || row.score > trends.get(row.key)) trends.set(row.key, row.score);
  }
  const exposures = new Map();
  if (exposureAvailable) for (const row of exposureSnapshot.rows) {
    if (!row || typeof row.key !== 'string') {
      exposureAvailable = false;
      exposures.clear();
      break;
    }
    if (!all.has(row.key)) continue;
    if (!Number.isSafeInteger(row.viewerDays) || row.viewerDays < 0) {
      exposureAvailable = false;
      exposures.clear();
      break; // Corrupt measurement is unknown, not a measured zero.
    }
    exposures.set(row.key, Math.max(exposures.get(row.key) || 0, row.viewerDays));
  }
  const channelExposure = new Map();
  for (const row of all.values()) {
    const channel = row.channelId || null;
    if (!channelExposure.has(channel)) channelExposure.set(channel, { total: 0, inventory: 0 });
    const stats = channelExposure.get(channel);
    stats.total += exposures.get(row.key) || 0;
    stats.inventory += 1;
  }
  const exposureAverage = (channel) => {
    const stats = channelExposure.get(channel);
    return exposureAvailable && stats ? stats.total / stats.inventory : null;
  };
  const rawPools = Object.fromEntries(sourceTypes.map((source) => [source, []]));
  for (const trailer of eligible) {
    const base = { key: trailer.key, movieId: trailer.movieId, trailerId: trailer.trailerId, channelId: trailer.channelId || null };
    if (profile?.hasPersonalTaste) {
      const score = scoreTrailerTaste(trailer, profile).score;
      if (Number.isFinite(score) && score > 0) rawPools.personal.push({ ...base, score });
    }
    if (trends.has(trailer.key)) rawPools.trending.push({ ...base, score: trends.get(trailer.key) });
    const uploaded = time(trailer.uploadedAt);
    const age = uploaded == null ? null : nowMs - uploaded;
    if (age != null && age >= 0 && age <= config.fresh.maxAgeDays * 86400_000) {
      rawPools.fresh.push({ ...base, score: 2 ** (-age / (config.fresh.halfLifeDays * 86400_000)) });
    }
    rawPools.exploration.push({ ...base, score: exposureAvailable ? 1 / (1 + (exposures.get(trailer.key) || 0)) : 0,
      scoreAvailable: exposureAvailable, exposureViewerDays: exposureAvailable ? exposures.get(trailer.key) || 0 : null });
  }

  const pools = {};
  const sourceStats = {};
  for (const source of sourceTypes) {
    const compareRows = (a, b) => b.score - a.score || tie(source, a.key).localeCompare(tie(source, b.key)) || a.key.localeCompare(b.key);
    rawPools[source].sort(compareRows);
    const selected = selectAcrossChannels(rawPools[source], {
      limit: config.candidates.limits[source], cap: config.candidates.maxPerChannelPerSource,
      relax: config.candidates.relaxChannelCapWhenSparse,
      compareChannels: (a, b) => {
        if (source === 'exploration') {
          if (exposureAvailable && config.candidates.exploration.preferUnderexposedChannels) {
            const difference = exposureAverage(a.channel) - exposureAverage(b.channel);
            if (difference) return difference;
          }
          return tie(`${source}:channel`, a.channel).localeCompare(tie(`${source}:channel`, b.channel));
        }
        return compareRows(a.items[0], b.items[0]);
      },
    });
    pools[source] = selected.rows;
    sourceStats[source] = { eligible: rawPools[source].length, selected: selected.rows.length,
      channels: selected.channelCount, channelCapRelaxed: selected.relaxed };
  }

  // Interleave sources for an unbiased union insertion order, then protect channel
  // coverage again if the deduplicated union exceeds the GLOBAL candidate cap.
  const merged = new Map();
  const longest = Math.max(0, ...sourceTypes.map((source) => pools[source].length));
  for (let index = 0; index < longest; index += 1) for (const source of sourceTypes) {
    const row = pools[source][index];
    if (!row) continue;
    if (!merged.has(row.key)) merged.set(row.key, { ...all.get(row.key), sources: [], sourceScores: {},
      exposureViewerDays: exposureAvailable ? exposures.get(row.key) || 0 : null });
    const entry = merged.get(row.key);
    entry.sources.push(source);
    entry.sourceScores[source] = row.score;
  }
  const final = selectAcrossChannels([...merged.values()], {
    limit: config.candidates.maxTotal,
    compareChannels: (a, b) => tie('union:channel', a.channel).localeCompare(tie('union:channel', b.channel)),
  }).rows;
  const kept = new Set(final.map((row) => row.key));
  for (const source of sourceTypes) {
    pools[source] = pools[source].filter((row) => kept.has(row.key));
    sourceStats[source].afterGlobalCap = pools[source].length;
  }
  return {
    generatedAt: new Date(nowMs).toISOString(), candidates: final, pools, sourceStats,
    sourceStatus: { personal: profile?.hasPersonalTaste ? 'available' : 'no-taste',
      trending: trendAvailable ? 'available' : 'unavailable-or-stale',
      exploration: exposureAvailable ? 'measured-exposure' : 'rotating-unknown-exposure' },
    catalogSize: all.size, eligibleSize: eligible.length, excludedSize: all.size - eligible.length,
    exposureScope: exposureAvailable ? exposureSnapshot.scope || 'provided-snapshot' : 'unavailable',
  };
};

module.exports = { buildCandidatePools, validateCandidateContext };
