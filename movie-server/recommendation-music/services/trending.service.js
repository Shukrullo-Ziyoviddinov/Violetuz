/**
 * Music trending scoring — shared formula from recommendation/services/trending.service
 * (no copy). Music-only wiring: contentSignals + contentId/contentType rows.
 *
 * @module recommendation-music/services/trending.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { getPopularitySignal } = require('../utils/contentSignals');
const { clamp } = require('../utils/index');
const {
  buildTrendingRanges,
  computeTrendingScore,
} = require('../../recommendation/services/trending.service');

/**
 * Score a batch of music listen aggregates (min-max within batch).
 *
 * @param {Array<Object>} rows
 * @param {Object} [weights]
 * @returns {Array<Object>}
 */
const scoreMusicTrendingBatch = (rows = [], weights = scoringWeights) => {
  if (!Array.isArray(rows) || !rows.length) return [];

  const forRanges = rows.map((r) => ({
    viewCountRecent: r.viewCountRecent,
    avgWatchDuration: r.avgListenDuration ?? r.avgWatchDuration,
    likeCount: r.likeCount,
  }));
  const ranges = buildTrendingRanges(forRanges);

  return rows.map((row) => {
    const avg =
      Number(row.avgListenDuration ?? row.avgWatchDuration) || 0;
    const raw = {
      viewCountRecent: Math.max(0, Number(row.viewCountRecent) || 0),
      avgWatchDuration: Math.max(0, avg),
      likeCount: Math.max(0, Number(row.likeCount) || 0),
      completionRateAvg: clamp(row.completionRateAvg ?? 0, 0, 1),
    };
    return {
      category: row.category,
      contentType: row.contentType,
      contentId: String(row.contentId),
      viewCountRecent: raw.viewCountRecent,
      avgListenDuration: raw.avgWatchDuration,
      likeCount: raw.likeCount,
      completionRateAvg: raw.completionRateAvg,
      trendingScore: computeTrendingScore(raw, ranges, weights),
      scoreSource: row.scoreSource === 'popularity' ? 'popularity' : 'trending',
    };
  });
};

/**
 * Empty-signal fallback: catalog popularity as trendingScore.
 *
 * @param {Array<Object>} contents — music projections
 * @param {string} category
 * @param {string} contentType
 * @returns {Array<Object>}
 */
const buildMusicPopularityFallbackScores = (
  contents = [],
  category = '',
  contentType = ''
) => {
  const cat = String(category || '').trim();
  const type = String(contentType || '').trim();
  if (!Array.isArray(contents) || !contents.length) return [];

  return contents.map((content) => {
    const popularity = clamp(getPopularitySignal(content), 0, 1);
    return {
      contentId: String(content.id),
      contentType: type || content.contentType,
      category: cat || String(content.categoryNameMusic || '').trim(),
      viewCountRecent: 0,
      avgListenDuration: 0,
      likeCount: 0,
      completionRateAvg: 0,
      trendingScore: popularity,
      scoreSource: 'popularity',
    };
  });
};

/**
 * Resolve stored trending for blend (music contentSignals fallback).
 *
 * @param {number|{ score: number, source?: string, scoreSource?: string }|null|undefined} stored
 * @param {Object} [content]
 * @param {Object} [weights]
 * @returns {{ score: number, source: 'trending'|'popularity'|'zero' }}
 */
const resolveMusicTrendingScore = (
  stored,
  content = null,
  weights = scoringWeights
) => {
  let score = null;
  let labeledSource = null;

  if (stored != null && typeof stored === 'object' && !Array.isArray(stored)) {
    if (typeof stored.score === 'number' && !Number.isNaN(stored.score)) {
      score = stored.score;
      labeledSource = stored.source || stored.scoreSource || null;
    }
  } else if (typeof stored === 'number' && !Number.isNaN(stored)) {
    score = stored;
  }

  if (score != null) {
    const clamped = clamp(score, 0, 1);
    if (labeledSource === 'popularity') {
      return { score: clamped, source: 'popularity' };
    }
    return { score: clamped, source: 'trending' };
  }

  const useFallback = weights.trending?.usePopularityFallback !== false;
  if (useFallback && content) {
    const pop = getPopularitySignal(content);
    if (pop > 0) return { score: clamp(pop, 0, 1), source: 'popularity' };
  }

  return { score: 0, source: 'zero' };
};

module.exports = {
  scoreMusicTrendingBatch,
  buildMusicPopularityFallbackScores,
  resolveMusicTrendingScore,
};
