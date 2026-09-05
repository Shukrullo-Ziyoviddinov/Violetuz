/**
 * Music content scoring (personalized dimensions + cold-start signals − listened penalty).
 * V1: no trending blend.
 *
 * @module recommendation-music/services/scoring.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { scoreAllDimensions, dimensions } = require('../dimensions');
const { toDecayedAffinityMap } = require('../utils/decay');
const {
  getPopularitySignal,
  getRatingSignal,
  getRecencySignal,
} = require('../utils/contentSignals');
const { contentKeyFromDoc } = require('../utils/contentKey');

const hasPersonalizationSignal = (affinityMap) => {
  if (!affinityMap || typeof affinityMap !== 'object') return false;
  for (const values of Object.values(affinityMap)) {
    if (!values || typeof values !== 'object') continue;
    for (const score of Object.values(values)) {
      if (typeof score === 'number' && score > 0) return true;
    }
  }
  return false;
};

const toListenedSet = (listenedKeys) => {
  if (!listenedKeys) return new Set();
  if (listenedKeys instanceof Set) {
    return new Set([...listenedKeys].map((id) => String(id)));
  }
  return new Set([...listenedKeys].map((id) => String(id)));
};

/**
 * @param {import('../types/musicRecommendation.types').MusicContent} content
 * @param {Object} [options]
 * @returns {import('../types/musicRecommendation.types').ScoredMusic}
 */
const scoreContent = (content, options = {}) => {
  const {
    affinityMap: rawAffinity = {},
    listenedKeys,
    includeBreakdown = false,
    now = Date.now(),
    weights = scoringWeights,
    dims = dimensions,
  } = options;

  const nowMs = now instanceof Date ? now.getTime() : now;
  const affinityMap = toDecayedAffinityMap(rawAffinity, nowMs, weights.decay);
  const coldStart = !hasPersonalizationSignal(affinityMap);

  const dimResult = coldStart
    ? { total: 0, byType: {} }
    : scoreAllDimensions(content, affinityMap, dims, weights);

  const popularity = getPopularitySignal(content);
  const rating = getRatingSignal(content);
  const recency = getRecencySignal(content, new Date(nowMs));

  const key = contentKeyFromDoc(content);
  const listened = toListenedSet(listenedKeys).has(key);
  const listenedPenalty = listened ? weights.listenedPenalty : 0;

  const finalScore =
    dimResult.total +
    weights.popularity * popularity +
    weights.rating * rating +
    weights.recency * recency -
    listenedPenalty;

  /** @type {import('../types/musicRecommendation.types').ScoredMusic} */
  const result = {
    content,
    score: finalScore,
    coldStart,
  };

  if (includeBreakdown) {
    result.breakdown = {
      ...dimResult.byType,
      popularity,
      rating,
      recency,
      listenedPenalty,
      final: finalScore,
      coldStart,
      byType: dimResult.byType,
    };
  }

  return result;
};

/**
 * @param {import('../types/musicRecommendation.types').MusicContent[]} contents
 * @param {Object} [options]
 */
const scoreContents = (contents, options = {}) => {
  if (!Array.isArray(contents) || contents.length === 0) return [];
  const scored = contents.map((content) => scoreContent(content, options));
  scored.sort((a, b) => b.score - a.score);
  return scored;
};

const scoreColdStart = (contents, options = {}) =>
  scoreContents(contents, { ...options, affinityMap: {} });

const rankTopN = (contents, options = {}) => {
  const limit = options.limit ?? scoringWeights.topN;
  return scoreContents(contents, options).slice(0, Math.max(0, limit));
};

module.exports = {
  hasPersonalizationSignal,
  scoreContent,
  scoreContents,
  scoreColdStart,
  rankTopN,
};
