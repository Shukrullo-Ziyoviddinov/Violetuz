/**
 * Serve music recommendations from precomputed cache (realtime fallback).
 * V1: no trending invalidation — absolute max-age only.
 *
 * @module recommendation-music/services/serve.service
 */

'use strict';

const mongoose = require('mongoose');
const { scoringWeights } = require('../config/scoringWeights');
const { getCachedTopN, precomputeUserCategoryRecommendations } = require('./precompute.service');
const {
  findContentsByKeysPreserveOrder,
} = require('../repositories/contentProjection.repository');
const { enqueuePrecomputeRecommendations } = require('../jobs/precomputeRecommendations.job');
const { badRequest } = require('../../utils/errors');

const parseUserId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  const str = String(value).trim();
  if (!mongoose.Types.ObjectId.isValid(str)) return null;
  return new mongoose.Types.ObjectId(str);
};

const toEpochMs = (value) => {
  if (value == null || value === '') return null;
  const t = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
};

const evaluateUserCacheStale = ({
  cacheGeneratedAt,
  now = Date.now(),
  weights = scoringWeights,
} = {}) => {
  const cacheMs = toEpochMs(cacheGeneratedAt);
  if (cacheMs == null) {
    return { stale: true, reason: 'missing_generated_at' };
  }

  const nowMs = now instanceof Date ? now.getTime() : now;
  const maxAgeMs =
    typeof weights.cache?.userCacheMaxAgeMs === 'number' && weights.cache.userCacheMaxAgeMs > 0
      ? weights.cache.userCacheMaxAgeMs
      : 2 * 60 * 60 * 1000;

  if (nowMs - cacheMs > maxAgeMs) {
    return { stale: true, reason: 'max_age' };
  }

  return { stale: false, reason: null };
};

/**
 * GET recommendations for categoryNameMusic.
 *
 * @param {Object} params
 */
const getRecommendationsByCategory = async (params) => {
  const userId = parseUserId(params.userId);
  const category = String(params.category || params.categoryNameMusic || '').trim();
  const limit = Math.max(
    1,
    Math.min(Number(params.limit) || scoringWeights.topN, scoringWeights.topN)
  );
  const hydrate = params.hydrate !== false;
  const lazy = params.lazy === true || params.lazy === 'true' || params.lazy === '1';

  if (!userId) {
    throw badRequest('userId majburiy (auth)');
  }
  if (!category) {
    throw badRequest('categoryNameMusic majburiy');
  }

  let source = 'cache';
  let generatedAt = null;
  let rows = await getCachedTopN(userId, category, limit);
  let queuedRefresh = false;

  if (rows.length) {
    generatedAt = rows[0]?.generatedAt || null;
    const freshness = evaluateUserCacheStale({ cacheGeneratedAt: generatedAt });
    if (freshness.stale) {
      if (lazy) {
        enqueuePrecomputeRecommendations({ userId, category });
        queuedRefresh = true;
        source = 'cache_stale';
      } else {
        rows = [];
        generatedAt = null;
        source = 'realtime';
      }
    }
  }

  if (!rows.length) {
    if (lazy) {
      enqueuePrecomputeRecommendations({ userId, category });
      source = 'pending';
      generatedAt = null;
      rows = [];
      queuedRefresh = true;
    } else {
      const computed = await precomputeUserCategoryRecommendations(userId, category, {
        topN: scoringWeights.topN,
      });
      source = computed.source === 'cold_start' ? 'cold_start' : 'realtime';
      generatedAt = computed.generatedAt;
      rows = computed.items.slice(0, limit).map((item, index) => ({
        contentKey: item.content.contentKey,
        contentType: item.content.contentType,
        contentId: String(item.content.id),
        score: item.score,
        rank: index + 1,
        generatedAt,
      }));
    }
  }

  const items = rows.map((row) => ({
    contentKey: row.contentKey,
    contentType: row.contentType,
    contentId: row.contentId,
    score: row.score,
    rank: row.rank,
  }));

  /** @type {Object} */
  const result = {
    userId: String(userId),
    category,
    categoryNameMusic: category,
    source,
    generatedAt,
    queuedRefresh,
    items,
  };

  if (hydrate && items.length) {
    const contents = await findContentsByKeysPreserveOrder(items);
    const scoreByKey = new Map(items.map((i) => [String(i.contentKey), i]));
    result.itemsHydrated = contents.map((doc) => ({
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
  parseUserId,
  evaluateUserCacheStale,
  getRecommendationsByCategory,
};
