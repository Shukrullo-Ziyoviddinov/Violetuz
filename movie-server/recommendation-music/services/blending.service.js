/**
 * Music confidence blending — shared math from recommendation/services/blending.service
 * (calculateAlpha, blendScores, minMaxNormalizeList). Does not mutate scoring/trending.
 *
 * @module recommendation-music/services/blending.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { scoreContent } = require('./scoring.service');
const { resolveMusicTrendingScore } = require('./trending.service');
const { getUserExperienceCount } = require('../repositories/userExperience.repository');
const { getTrendingScoreMap } = require('../repositories/trending.repository');
const {
  calculateAlpha,
  blendScores,
  minMaxNormalizeList,
} = require('../../recommendation/services/blending.service');

const shouldNormalize = (weights = scoringWeights) => {
  const mode = String(weights.blend?.normalizeMode || 'minmax').toLowerCase();
  return mode !== 'none';
};

/**
 * Batch blend for music candidate pool.
 *
 * @param {Array<Object>} contents
 * @param {Object} options
 * @returns {Promise<Array<Object>>} sorted by blended score DESC
 */
const scoreContentsBlended = async (contents, options = {}) => {
  if (!Array.isArray(contents) || !contents.length) return [];

  const {
    userId,
    category,
    contentType = null,
    scoreOptions = {},
    weights = scoringWeights,
  } = options;

  const cat = String(category || '').trim();
  const type = contentType
    ? String(contentType).trim()
    : contents[0]?.contentType
      ? String(contents[0].contentType).trim()
      : '';

  let experienceCount = options.experienceCount;
  if (experienceCount == null && userId && cat) {
    experienceCount = await getUserExperienceCount(userId, cat);
  }
  experienceCount = Math.max(0, Number(experienceCount) || 0);
  const alpha = calculateAlpha(experienceCount, weights);

  let trendingMap = options.trendingMap;
  if (!trendingMap && type) {
    trendingMap = await getTrendingScoreMap(
      cat,
      type,
      contents.map((c) => c.id)
    );
  }
  if (!trendingMap) trendingMap = new Map();

  const raw = contents.map((content) => {
    const personal = scoreContent(content, { ...scoreOptions, weights });
    const stored = trendingMap.get(String(content.id));
    const resolved = resolveMusicTrendingScore(
      stored === undefined ? null : stored,
      content,
      weights
    );

    return {
      content,
      personalizedScore: personal.score,
      trendingScore: resolved.score,
      trendingSource: resolved.source,
      coldStart: personal.coldStart,
    };
  });

  const normPersonalList = shouldNormalize(weights)
    ? minMaxNormalizeList(raw.map((r) => r.personalizedScore))
    : raw.map((r) => r.personalizedScore);

  const normTrendingList = shouldNormalize(weights)
    ? minMaxNormalizeList(raw.map((r) => r.trendingScore))
    : raw.map((r) => r.trendingScore);

  const scored = raw.map((row, i) => {
    const normPersonal = normPersonalList[i];
    const normTrending = normTrendingList[i];
    const blended = blendScores(normPersonal, normTrending, alpha);

    return {
      content: row.content,
      score: blended,
      alpha,
      experienceCount,
      personalizedScore: row.personalizedScore,
      trendingScore: row.trendingScore,
      normalizedPersonalizedScore: normPersonal,
      normalizedTrendingScore: normTrending,
      trendingSource: row.trendingSource,
      coldStart: row.coldStart,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
};

module.exports = {
  calculateAlpha,
  blendScores,
  minMaxNormalizeList,
  scoreContentsBlended,
};
