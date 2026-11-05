'use strict';
// Offline acceptance check: real local catalog, no DB, writes or invented engagement.
const assert = require('node:assert/strict');
const { buildTrailerCatalog, buildCandidatePools, rankTrailerCandidates } = require('../trailer-home-feed');
const { trailerHomeFeedWeights: weights } = require('../trailer-home-feed');
const catalog = buildTrailerCatalog(require('../data/movie.json'));
const nowMs = Date.now();
const channels = new Set(catalog.map((row) => row.channelId).filter(Boolean));
const runs = [];
for (let index = 0; index < 30; index += 1) {
  const sessionSeed = `offline_acceptance_seed_${String(index).padStart(4, '0')}`;
  const candidateSnapshot = buildCandidatePools({ catalog, sessionSeed, nowMs });
  const result = rankTrailerCandidates({ candidateSnapshot, sessionSeed, nowMs });
  assert.equal(new Set(result.items.map((row) => row.key)).size, result.items.length, 'Duplicate trailer');
  assert.equal(result.sourceCounts.personal, 0, 'Fabricated new-viewer taste');
  assert.equal(result.sourceCounts.trending, 0, 'Fabricated engagement');
  for (let position = 0; position < result.items.length; position += 1) {
    const row = result.items[position];
    const window = result.items.slice(Math.max(0, position - weights.diversity.windowSize + 1), position + 1);
    if (position && row.channelId === result.items[position - 1].channelId) {
      assert.ok(row.relaxedConstraints.includes('adjacentChannel'));
    }
    if (window.filter((item) => item.movieId === row.movieId).length > weights.diversity.maxPerMovieInWindow) {
      assert.ok(row.relaxedConstraints.includes('movie'));
    }
    if (window.filter((item) => item.channelId === row.channelId).length > weights.diversity.maxPerChannelInWindow) {
      assert.ok(row.relaxedConstraints.includes('channel'));
    }
  }
  const blocked = result.items.slice(0, 5).map((row) => row.key);
  const filtered = rankTrailerCandidates({ candidateSnapshot: buildCandidatePools({ catalog, sessionSeed, nowMs, excludeKeys: blocked }),
    repetitionState: { hardExcludedKeys: blocked }, sessionSeed, nowMs });
  assert.ok(filtered.items.every((row) => !blocked.includes(row.key)), 'Hard exclusion restored');
  runs.push({ returned: result.returned, channels: new Set(result.items.map((row) => row.channelId).filter(Boolean)).size,
    adjacentRepeats: result.items.filter((row, i) => i > 0 && row.channelId === result.items[i - 1].channelId).length,
    sourceCounts: result.sourceCounts, relaxations: result.relaxations });
}
const range = (key) => ({ min: Math.min(...runs.map((row) => row[key])), max: Math.max(...runs.map((row) => row[key])) });
console.log(JSON.stringify({ mode: 'offline-cold-start-no-engagement', catalog: { trailers: catalog.length,
  movies: new Set(catalog.map((row) => row.movieId)).size, knownChannels: channels.size,
  missingImages: catalog.filter((row) => !row.trillerimg).length, missingUploadTimes: catalog.filter((row) => !row.uploadedAt).length },
  seeds: runs.length, returned: range('returned'), feedChannels: range('channels'), adjacentRepeats: range('adjacentRepeats'),
  example: runs[0], limitations: ['Not production traffic or quality measurement', 'No trend data supplied; no fabricated popularity',
    'No player or card telemetry integration tested by this offline script'] }, null, 2));
