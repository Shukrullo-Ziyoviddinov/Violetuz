/**
 * Precompute personalized Top-N per user × categoryNameMusic × contentType.
 * (no trending blend in v1)
 *
 * @module recommendation-music/services/precompute.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { hasPersonalizationSignal, scoreContents } = require('./scoring.service');
const { diversifyRecommendations } = require('./diversity.service');
const { toDecayedAffinityMap } = require('../utils/decay');
const { buildCategoryCandidatePool } = require('../repositories/contentProjection.repository');
const { getAffinityMapWithMeta } = require('../repositories/userAffinity.repository');
const { listListenedContentKeys } = require('../repositories/userProgress.repository');
const {
  replaceUserCategoryRecommendations,
  listCachedRecommendations,
} = require('../repositories/userRecommendation.repository');
const { normalizeContentType, isValidContentType } = require('../utils/contentKey');

/**
 * @param {*} userId
 * @param {string} category — categoryNameMusic
 * @param {Object} [options]
 * @param {string} [options.contentType] — music|album|clip|concert (recommended)
 */
const precomputeUserCategoryRecommendations = async (userId, category, options = {}) => {
  const cat = String(category || '').trim();
  if (!userId || !cat) {
    const err = new Error('userId and category are required for precompute');
    err.status = 400;
    throw err;
  }

  const contentType = normalizeContentType(options.contentType);
  const scopedType =
    contentType && isValidContentType(contentType) ? contentType : null;

  const topN = options.topN ?? scoringWeights.topN;
  const popularLimit =
    options.candidatePoolPopular ??
    options.candidatePoolSize ??
    scoringWeights.candidatePoolPopular ??
    300;
  const affinityLimit =
    options.candidatePoolAffinity ?? scoringWeights.candidatePoolAffinity ?? 150;
  const now = options.now ?? Date.now();
  const nowMs = now instanceof Date ? now.getTime() : now;
  const generatedAt = new Date(nowMs);

  const [affinityMeta, listenedKeys] = await Promise.all([
    getAffinityMapWithMeta(userId, cat),
    listListenedContentKeys(userId, cat),
  ]);

  const affinityMap = toDecayedAffinityMap(affinityMeta, nowMs, scoringWeights.decay);
  const personalized = hasPersonalizationSignal(affinityMap);

  const contentTypes = scopedType
    ? [scopedType]
    : options.contentTypes || scoringWeights.contentTypes;

  const contents = await buildCategoryCandidatePool(cat, {
    affinityMap: personalized ? affinityMap : null,
    popularLimit,
    affinityLimit: personalized ? affinityLimit : 0,
    seedGenres: scoringWeights.affinitySeedGenres,
    seedCountries: scoringWeights.affinitySeedCountries,
    seedLanguages: scoringWeights.affinitySeedLanguages,
    seedArtists: scoringWeights.affinitySeedArtists,
    contentTypes,
  });

  const scored = scoreContents(contents, {
    affinityMap,
    listenedKeys,
    now: nowMs,
  });

  const diversified = diversifyRecommendations(scored, { limit: topN });

  const cacheRows = diversified.map((item, index) => ({
    contentKey: item.content.contentKey,
    contentType: item.content.contentType,
    contentId: String(item.content.id),
    score: item.score,
    rank: index + 1,
  }));

  const { written } = await replaceUserCategoryRecommendations(
    userId,
    cat,
    cacheRows,
    { contentType: scopedType || undefined }
  );

  return {
    userId,
    category: cat,
    contentType: scopedType,
    written,
    source: personalized ? 'personalized' : 'cold_start',
    poolSize: contents.length,
    generatedAt,
    items: diversified,
  };
};

const getCachedTopN = (userId, category, limit = scoringWeights.topN, options = {}) =>
  listCachedRecommendations(userId, category, limit, options);

module.exports = {
  precomputeUserCategoryRecommendations,
  getCachedTopN,
};
