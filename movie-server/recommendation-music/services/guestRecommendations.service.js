/**
 * Guest music recommendations — same score/trending/blend as login precompute,
 * affinity from localHistory (stateless). NEVER writes music_recommendation user_* collections.
 *
 * @module recommendation-music/services/guestRecommendations.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { hasPersonalizationSignal } = require('./scoring.service');
const { scoreContentsBlended } = require('./blending.service');
const { diversifyRecommendations } = require('./diversity.service');
const {
  buildCategoryCandidatePool,
  findContentProjection,
  findContentsByKeysPreserveOrder,
} = require('../repositories/contentProjection.repository');
const {
  buildFromEvents,
  guestHistoryConfig,
} = require('./guestAffinityBuilder.service');
const {
  normalizeContentType,
  isValidContentType,
  toContentKey,
} = require('../utils/contentKey');
const { badRequest } = require('../../utils/errors');

/**
 * POST /api/music-recommendations/:categoryNameMusic/guest
 *
 * @param {Object} params
 * @param {string} params.category
 * @param {string} [params.contentType]
 * @param {unknown} params.localHistory
 * @param {number} [params.limit]
 * @param {boolean} [params.hydrate]
 */
const getGuestRecommendationsByCategory = async (params = {}) => {
  const category = String(params.category || '').trim();
  const limit = Math.max(
    1,
    Math.min(Number(params.limit) || scoringWeights.topN, scoringWeights.topN)
  );
  const hydrate = params.hydrate !== false;
  const nowMs = Date.now();

  if (!category) {
    throw badRequest('category majburiy');
  }

  const contentTypeRaw = params.contentType;
  const contentType = contentTypeRaw
    ? normalizeContentType(contentTypeRaw)
    : null;
  if (contentTypeRaw && !isValidContentType(contentType)) {
    throw badRequest(`invalid contentType: ${String(contentTypeRaw)}`);
  }

  const preview = buildFromEvents(params.localHistory, {
    category,
    contentsByKey: new Map(),
    nowMs,
  });
  if (!preview.ok) {
    throw badRequest(preview.error);
  }

  // Load ALL history types in category for affinity (login parity); pool still type-scoped
  const uniquePairs = [];
  const seen = new Set();
  for (const e of preview.events) {
    const key = toContentKey(e.ct, e.m);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    uniquePairs.push({ contentType: e.ct, contentId: e.m, contentKey: key });
  }

  const projections = await Promise.all(
    uniquePairs.map((p) => findContentProjection(p.contentType, p.contentId))
  );
  const contentsByKey = new Map();
  for (let i = 0; i < uniquePairs.length; i += 1) {
    const doc = projections[i];
    if (doc) contentsByKey.set(uniquePairs[i].contentKey, doc);
  }

  const built = buildFromEvents(params.localHistory, {
    category,
    contentsByKey,
    nowMs,
  });
  if (!built.ok) {
    throw badRequest(built.error);
  }

  const { affinityMap, experienceCount, listenedKeys } = built;
  const personalized = hasPersonalizationSignal(affinityMap);

  const popularLimit =
    scoringWeights.candidatePoolPopular ?? scoringWeights.candidatePoolSize ?? 300;
  const affinityLimit = scoringWeights.candidatePoolAffinity ?? 150;

  const contentTypes = contentType
    ? [contentType]
    : scoringWeights.contentTypes;

  const contents = await buildCategoryCandidatePool(category, {
    affinityMap: personalized ? affinityMap : null,
    popularLimit,
    affinityLimit: personalized ? affinityLimit : 0,
    seedGenres: scoringWeights.affinitySeedGenres,
    seedCountries: scoringWeights.affinitySeedCountries,
    seedLanguages: scoringWeights.affinitySeedLanguages,
    seedArtists: scoringWeights.affinitySeedArtists,
    contentTypes,
  });

  const scored = await scoreContentsBlended(contents, {
    category,
    contentType: contentType || contentTypes[0] || null,
    experienceCount,
    scoreOptions: {
      affinityMap,
      listenedKeys,
      now: nowMs,
    },
  });

  const diversified = diversifyRecommendations(scored, { limit });
  const generatedAt = new Date(nowMs);
  const alpha = diversified[0]?.alpha ?? scored[0]?.alpha ?? 0;

  const items = diversified.map((item, index) => ({
    contentKey: item.content.contentKey || toContentKey(item.content.contentType, item.content.id),
    contentType: item.content.contentType,
    contentId: String(item.content.id),
    score: item.score,
    rank: index + 1,
  }));

  /** @type {Object} */
  const result = {
    userId: null,
    category,
    categoryNameMusic: category,
    contentType: contentType || null,
    source: personalized ? 'guest_blended' : 'guest_trending',
    generatedAt,
    queuedRefresh: false,
    alpha,
    experienceCount,
    historySize: preview.events.length,
    maxEntries: guestHistoryConfig.MAX_ENTRIES,
    items,
  };

  if (hydrate && items.length) {
    const docs = await findContentsByKeysPreserveOrder(items);
    const scoreByKey = new Map(items.map((i) => [String(i.contentKey), i]));
    result.itemsHydrated = docs.map((doc) => ({
      ...doc,
      recommendationScore: scoreByKey.get(String(doc.contentKey))?.score ?? null,
      recommendationRank: scoreByKey.get(String(doc.contentKey))?.rank ?? null,
    }));
  } else {
    result.itemsHydrated = [];
  }

  return result;
};

module.exports = {
  getGuestRecommendationsByCategory,
};
