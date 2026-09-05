/**
 * Diversity re-ranking for music — artist / country caps.
 *
 * @module recommendation-music/services/diversity.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { toStringList } = require('../../recommendation/utils/values');

const extractDiversityKeys = (content) => ({
  artists: toStringList(content?.artistId),
  countries: toStringList(content?.country),
});

const wouldExceedShare = (counts, keys, maxAllowed) => {
  if (maxAllowed <= 0) return false;
  for (const key of keys) {
    if ((counts.get(key) || 0) + 1 > maxAllowed) return true;
  }
  return false;
};

const violatesWindow = (selected, keys, diversity) => {
  const windowSize = Math.max(1, diversity.windowSize || 5);
  const maxRepeats = Math.max(1, diversity.maxRepeatsInWindow || 2);
  const window = selected.slice(-Math.max(0, windowSize - 1));

  const countInWindow = (fieldKeys, getField) => {
    for (const key of fieldKeys) {
      let n = 0;
      for (const item of window) {
        const vals = getField(item.content);
        if (vals.includes(key)) n += 1;
      }
      if (n + 1 > maxRepeats) return true;
    }
    return false;
  };

  if (countInWindow(keys.artists, (c) => extractDiversityKeys(c).artists)) return true;
  if (countInWindow(keys.countries, (c) => extractDiversityKeys(c).countries)) return true;
  return false;
};

const softRepeatPenalty = (counts, keys, repeatPenalty) => {
  let penalty = 0;
  for (const key of keys) {
    const n = counts.get(key) || 0;
    if (n > 0) penalty += repeatPenalty * n;
  }
  return penalty;
};

const resolveEffectiveRepeatPenalty = (items, diversity) => {
  const base = Number(diversity.repeatPenalty);
  const configured = Number.isFinite(base) ? base : 0.35;
  const mode = String(diversity.penaltyScale || 'range').toLowerCase();

  if (mode === 'absolute' || !items.length) return configured;

  let min = Infinity;
  let max = -Infinity;
  for (const item of items) {
    const s = typeof item.score === 'number' && !Number.isNaN(item.score) ? item.score : 0;
    if (s < min) min = s;
    if (s > max) max = s;
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return configured;

  const span = max - min;
  if (span <= 1e-12) return configured * Math.max(Math.abs(max), 1e-6);

  return configured * span;
};

const bumpCounts = (counts, keys) => {
  for (const key of keys) {
    counts.set(key, (counts.get(key) || 0) + 1);
  }
};

/**
 * @param {import('../types/musicRecommendation.types').ScoredMusic[]} scored
 * @param {Object} [options]
 */
const diversifyRecommendations = (scored, options = {}) => {
  if (!Array.isArray(scored) || scored.length === 0) return [];

  const limit = Math.max(1, options.limit ?? scoringWeights.topN);
  const diversity = options.diversity || scoringWeights.diversity;

  const maxArtistShare = Math.max(
    1,
    Math.floor(limit * (diversity.maxSharePerArtist ?? 0.4))
  );
  const maxCountryShare = Math.max(
    1,
    Math.floor(limit * (diversity.maxSharePerCountry ?? 0.4))
  );

  const remaining = scored.map((item) => ({ ...item }));
  const repeatPenalty = resolveEffectiveRepeatPenalty(remaining, diversity);

  /** @type {import('../types/musicRecommendation.types').ScoredMusic[]} */
  const selected = [];
  const artistCounts = new Map();
  const countryCounts = new Map();

  const tryPick = (rules) => {
    let bestIdx = -1;
    let bestAdjusted = -Infinity;

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      const keys = extractDiversityKeys(candidate.content);

      if (rules.enforceArtistShare && wouldExceedShare(artistCounts, keys.artists, maxArtistShare)) {
        continue;
      }
      if (
        rules.enforceCountryShare &&
        wouldExceedShare(countryCounts, keys.countries, maxCountryShare)
      ) {
        continue;
      }
      if (rules.enforceWindow && violatesWindow(selected, keys, diversity)) continue;

      const penalty =
        softRepeatPenalty(artistCounts, keys.artists, repeatPenalty) +
        softRepeatPenalty(countryCounts, keys.countries, repeatPenalty);

      const adjusted = candidate.score - penalty;
      if (adjusted > bestAdjusted) {
        bestAdjusted = adjusted;
        bestIdx = i;
      }
    }

    return bestIdx;
  };

  while (selected.length < limit && remaining.length > 0) {
    let idx = tryPick({
      enforceWindow: true,
      enforceArtistShare: true,
      enforceCountryShare: true,
    });
    if (idx < 0) {
      idx = tryPick({
        enforceWindow: false,
        enforceArtistShare: true,
        enforceCountryShare: true,
      });
    }
    if (idx < 0) {
      idx = tryPick({
        enforceWindow: false,
        enforceArtistShare: true,
        enforceCountryShare: false,
      });
    }
    if (idx < 0) {
      idx = tryPick({
        enforceWindow: false,
        enforceArtistShare: false,
        enforceCountryShare: false,
      });
    }
    if (idx < 0) break;

    const [picked] = remaining.splice(idx, 1);
    const keys = extractDiversityKeys(picked.content);
    bumpCounts(artistCounts, keys.artists);
    bumpCounts(countryCounts, keys.countries);
    selected.push(picked);
  }

  return selected;
};

module.exports = {
  extractDiversityKeys,
  resolveEffectiveRepeatPenalty,
  diversifyRecommendations,
};
