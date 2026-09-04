/**
 * Diversity re-ranking — prevents one actor/country from dominating Top-N.
 *
 * Combines:
 *  1) Soft MMR-style repeat penalty (repeatPenalty from config)
 *  2) Hard sliding-window cap (e.g. same actor ≤ 2 in any window of 5)
 *  3) Hard share cap (e.g. one actor/country ≤ 40% of final Top-N)
 *
 * Additive scoring stays intact — this only reorders / filters the ranked list.
 *
 * @module recommendation/services/diversity.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { toStringList } = require('../utils/values');

/**
 * @param {import('../types/recommendation.types').Movie} movie
 * @returns {{ actors: string[], countries: string[] }}
 */
const extractDiversityKeys = (movie) => ({
  actors: toStringList(movie?.actors),
  countries: toStringList(movie?.filterCountry),
});

/**
 * @param {Map<string, number>} counts
 * @param {string[]} keys
 * @param {number} maxAllowed
 * @returns {boolean} true if adding would exceed share
 */
const wouldExceedShare = (counts, keys, maxAllowed) => {
  if (maxAllowed <= 0) return false;
  for (const key of keys) {
    if ((counts.get(key) || 0) + 1 > maxAllowed) return true;
  }
  return false;
};

/**
 * @param {Array<{ movie: import('../types/recommendation.types').Movie }>} selected
 * @param {{ actors: string[], countries: string[] }} keys
 * @param {{ windowSize: number, maxRepeatsInWindow: number }} diversity
 * @returns {boolean}
 */
const violatesWindow = (selected, keys, diversity) => {
  const windowSize = Math.max(1, diversity.windowSize || 5);
  const maxRepeats = Math.max(1, diversity.maxRepeatsInWindow || 2);
  const window = selected.slice(-Math.max(0, windowSize - 1));

  const countInWindow = (fieldKeys, getField) => {
    for (const key of fieldKeys) {
      let n = 0;
      for (const item of window) {
        const vals = getField(item.movie);
        if (vals.includes(key)) n += 1;
      }
      if (n + 1 > maxRepeats) return true;
    }
    return false;
  };

  if (countInWindow(keys.actors, (m) => extractDiversityKeys(m).actors)) return true;
  if (countInWindow(keys.countries, (m) => extractDiversityKeys(m).countries)) return true;
  return false;
};

/**
 * Soft penalty for already-selected actors/countries.
 * @param {Map<string, number>} counts
 * @param {string[]} keys
 * @param {number} repeatPenalty
 * @returns {number}
 */
const softRepeatPenalty = (counts, keys, repeatPenalty) => {
  let penalty = 0;
  for (const key of keys) {
    const n = counts.get(key) || 0;
    if (n > 0) penalty += repeatPenalty * n;
  }
  return penalty;
};

/**
 * @param {Map<string, number>} counts
 * @param {string[]} keys
 */
const bumpCounts = (counts, keys) => {
  for (const key of keys) {
    counts.set(key, (counts.get(key) || 0) + 1);
  }
};

/**
 * Greedy diversified Top-N from a score-sorted list.
 *
 * @param {import('../types/recommendation.types').ScoredMovie[]} scoredMovies
 * @param {Object} [options]
 * @param {number} [options.limit]
 * @param {import('../types/recommendation.types').DiversityConfig} [options.diversity]
 * @returns {import('../types/recommendation.types').ScoredMovie[]}
 */
const diversifyRecommendations = (scoredMovies, options = {}) => {
  if (!Array.isArray(scoredMovies) || scoredMovies.length === 0) return [];

  const limit = Math.max(1, options.limit ?? scoringWeights.topN);
  const diversity = options.diversity || scoringWeights.diversity;

  const maxActorShare = Math.max(1, Math.floor(limit * (diversity.maxSharePerActor ?? 0.4)));
  const maxCountryShare = Math.max(1, Math.floor(limit * (diversity.maxSharePerCountry ?? 0.4)));
  const repeatPenalty = diversity.repeatPenalty ?? 0.35;

  /** @type {import('../types/recommendation.types').ScoredMovie[]} */
  const remaining = scoredMovies.map((item) => ({
    movie: item.movie,
    score: item.score,
    breakdown: item.breakdown,
    coldStart: item.coldStart,
  }));

  /** @type {import('../types/recommendation.types').ScoredMovie[]} */
  const selected = [];
  const actorCounts = new Map();
  const countryCounts = new Map();

  /**
   * @param {{ enforceWindow: boolean, enforceActorShare: boolean, enforceCountryShare: boolean }} rules
   * @returns {number}
   */
  const tryPick = (rules) => {
    let bestIdx = -1;
    let bestAdjusted = -Infinity;

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      const keys = extractDiversityKeys(candidate.movie);

      if (rules.enforceActorShare && wouldExceedShare(actorCounts, keys.actors, maxActorShare)) {
        continue;
      }
      if (rules.enforceCountryShare && wouldExceedShare(countryCounts, keys.countries, maxCountryShare)) {
        continue;
      }
      if (rules.enforceWindow && violatesWindow(selected, keys, diversity)) continue;

      const penalty =
        softRepeatPenalty(actorCounts, keys.actors, repeatPenalty) +
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
    // Prefer keeping actor+country 40% caps; relax window first, then country share,
    // then (tiny/narrow catalogs only) drop all hard caps.
    let idx = tryPick({ enforceWindow: true, enforceActorShare: true, enforceCountryShare: true });
    if (idx < 0) {
      idx = tryPick({
        enforceWindow: false,
        enforceActorShare: true,
        enforceCountryShare: true,
      });
    }
    if (idx < 0) {
      idx = tryPick({
        enforceWindow: false,
        enforceActorShare: true,
        enforceCountryShare: false,
      });
    }
    if (idx < 0) {
      idx = tryPick({
        enforceWindow: false,
        enforceActorShare: false,
        enforceCountryShare: false,
      });
    }
    if (idx < 0) break;

    const [picked] = remaining.splice(idx, 1);
    const keys = extractDiversityKeys(picked.movie);
    bumpCounts(actorCounts, keys.actors);
    bumpCounts(countryCounts, keys.countries);
    selected.push(picked);
  }

  return selected;
};

/**
 * Diagnostics helper for tests: max share of any single actor/country in a list.
 *
 * @param {import('../types/recommendation.types').ScoredMovie[]} items
 * @returns {{ maxActorShare: number, maxCountryShare: number, actorShares: Object.<string, number>, countryShares: Object.<string, number> }}
 */
const measureDiversityShares = (items) => {
  const n = items.length || 1;
  /** @type {Object.<string, number>} */
  const actorShares = {};
  /** @type {Object.<string, number>} */
  const countryShares = {};

  for (const item of items) {
    const { actors, countries } = extractDiversityKeys(item.movie);
    for (const a of actors) actorShares[a] = (actorShares[a] || 0) + 1;
    for (const c of countries) countryShares[c] = (countryShares[c] || 0) + 1;
  }

  const maxCount = (obj) => Object.values(obj).reduce((m, v) => Math.max(m, v), 0);

  return {
    maxActorShare: maxCount(actorShares) / n,
    maxCountryShare: maxCount(countryShares) / n,
    actorShares,
    countryShares,
  };
};

module.exports = {
  extractDiversityKeys,
  diversifyRecommendations,
  measureDiversityShares,
};
