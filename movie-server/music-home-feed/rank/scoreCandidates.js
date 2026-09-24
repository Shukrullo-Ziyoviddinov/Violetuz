/**
 * Bir xil contentId bitta nomzodga yig'iladi.
 * Har bir manba bali saqlanadi, keyin vazn bilan qo'shiladi.
 * Tinglangan qo'shiqdan recommendation-music listenedPenalty ayiriladi.
 * Formula nusxalanmaydi.
 *
 * @module music-home-feed/rank/scoreCandidates
 */

'use strict';

const { musicHomeFeedWeights } = require('../config/musicHomeFeedWeights');
const { scoringWeights } = require('../../recommendation-music/config/scoringWeights');

const SOURCE_ORDER = Object.freeze([
  'personal',
  'collaborative',
  'trending',
  'fresh',
  'exploration',
]);

/**
 * @param {Array<Array<Object>>} sourceLists
 * @param {Set<string>} listenedIds
 * @returns {Array<{ contentId: string, category: string, scores: Record<string, number>, finalScore: number, sourceType: string, listened: boolean }>}
 */
const scoreAndDedupe = (sourceLists, listenedIds = new Set()) => {
  const weights = musicHomeFeedWeights.rankWeights || {};
  const penalty = Number(scoringWeights.listenedPenalty) || 0;
  /** @type {Map<string, { contentId: string, category: string, scores: Record<string, number> }>} */
  const byId = new Map();

  for (const list of sourceLists) {
    for (const row of list || []) {
      const contentId = String(row.contentId || '').trim();
      const sourceType = String(row.sourceType || '').trim();
      if (!contentId || !SOURCE_ORDER.includes(sourceType)) continue;

      let item = byId.get(contentId);
      if (!item) {
        item = {
          contentId,
          category: String(row.category || '').trim(),
          scores: {},
        };
        byId.set(contentId, item);
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

    const listened = listenedIds.has(item.contentId);
    if (listened) finalScore -= penalty;

    out.push({
      contentId: item.contentId,
      category: item.category,
      scores: item.scores,
      finalScore,
      sourceType,
      listened,
    });
  }

  return out;
};

module.exports = {
  SOURCE_ORDER,
  scoreAndDedupe,
};
