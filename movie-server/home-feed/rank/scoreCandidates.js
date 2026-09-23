/**
 * Bir xil movieId bitta nomzodga yig'iladi.
 * Har bir manba bali saqlanadi, keyin vazn bilan qo'shiladi.
 * Juftlik manbasi yo'q — uning vazni ishlatilmaydi.
 *
 * @module home-feed/rank/scoreCandidates
 */

'use strict';

const { homeFeedWeights } = require('../config/homeFeedWeights');

const SOURCE_ORDER = Object.freeze([
  'personal',
  'collaborative',
  'trending',
  'fresh',
  'exploration',
]);

/**
 * @param {Array<Array<Object>>} sourceLists
 * @param {Set<string>} watchedIds
 * @returns {Array<{ movieId: string, category: string, scores: Record<string, number>, finalScore: number, sourceType: string, watched: boolean }>}
 */
const scoreAndDedupe = (sourceLists, watchedIds = new Set()) => {
  const weights = homeFeedWeights.rankWeights || {};
  const penalty = Number(homeFeedWeights.watchedPenalty) || 0;
  /** @type {Map<string, { movieId: string, category: string, scores: Record<string, number> }>} */
  const byId = new Map();

  for (const list of sourceLists) {
    for (const row of list || []) {
      const movieId = String(row.movieId || '').trim();
      const sourceType = String(row.sourceType || '').trim();
      if (!movieId || !SOURCE_ORDER.includes(sourceType)) continue;

      let item = byId.get(movieId);
      if (!item) {
        item = {
          movieId,
          category: String(row.category || '').trim(),
          scores: {},
        };
        byId.set(movieId, item);
      }

      const normalized = Math.min(1, Math.max(0, Number(row.normalizedScore) || 0));
      if (item.scores[sourceType] == null || normalized > item.scores[sourceType]) {
        item.scores[sourceType] = normalized;
      }
    }
  }

  /** @type {ReturnType<typeof scoreAndDedupe>} */
  const out = [];
  for (const item of byId.values()) {
    let finalScore = 0;
    let bestWeighted = -Infinity;
    let sourceType = null;

    for (const type of SOURCE_ORDER) {
      if (item.scores[type] == null) continue;
      const weighted = (Number(weights[type]) || 0) * item.scores[type];
      finalScore += weighted;
      if (sourceType == null || weighted > bestWeighted) {
        bestWeighted = weighted;
        sourceType = type;
      }
    }

    if (!sourceType) continue;

    const watched = watchedIds.has(item.movieId);
    if (watched) finalScore -= penalty;

    out.push({
      movieId: item.movieId,
      category: item.category,
      scores: item.scores,
      finalScore,
      sourceType,
      watched,
    });
  }

  return out;
};

module.exports = {
  SOURCE_ORDER,
  scoreAndDedupe,
};
