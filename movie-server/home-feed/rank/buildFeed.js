/**
 * To'rt manbani yig'ib lentani tartiblaydi.
 * HTTP yo'q. home_feed_cache ga yozilmaydi.
 *
 * @module home-feed/rank/buildFeed
 */

'use strict';

const { homeFeedWeights } = require('../config/homeFeedWeights');
const { listWatchProgress } = require('../repositories/watchProgress.read');
const { findRankMetaByIds } = require('../sources/catalog.read');
const { listPersonalSource } = require('../sources/personal.source');
const { listTrendingSource } = require('../sources/trending.source');
const { listFreshSource } = require('../sources/fresh.source');
const { listExplorationSource } = require('../sources/exploration.source');
const { listCollaborativeSource } = require('../sources/collaborative.source');
const { normalizeSourceRows } = require('./normalize');
const { scoreAndDedupe } = require('./scoreCandidates');
const { mixSlots } = require('./slotMix');
const { diversifyFeed } = require('./diversify');

/**
 * Manbalar tayyor bo'lgach tartib. Yozuv yo'q.
 *
 * @param {Object} input
 * @returns {Promise<{ movies: Object[] }>}
 */
const assembleHomeFeed = async ({
  personal,
  collaborative = [],
  trending,
  fresh,
  exploration,
  watchedIds,
}) => {
  const scored = scoreAndDedupe(
    [
      normalizeSourceRows(personal, { perCategory: true }),
      normalizeSourceRows(collaborative, { perCategory: false }),
      normalizeSourceRows(trending, { perCategory: true }),
      normalizeSourceRows(fresh, { perCategory: false }),
      normalizeSourceRows(exploration, { perCategory: false }),
    ],
    watchedIds
  );

  const meta = await findRankMetaByIds(scored.map((row) => row.movieId));
  const withMeta = [];
  for (const row of scored) {
    const info = meta.get(row.movieId);
    if (!info) continue;
    withMeta.push({
      ...row,
      category: info.category,
      actors: info.actors,
    });
  }

  const mixed = mixSlots(withMeta);
  const diversified = diversifyFeed(mixed, homeFeedWeights.feedSize);

  const movies = diversified.map((row, index) => ({
    movieId: row.movieId,
    category: row.category,
    position: index + 1,
    score: row.finalScore,
    sourceType: row.sourceType,
    watched: row.watched,
  }));

  return { movies };
};

/**
 * Login yoki foydalanuvchisiz katalog. Mehmon localHistory bu funksiyaga kirmaydi.
 *
 * @param {{ userId?: string|import('mongoose').Types.ObjectId|null, nowMs?: number }} [opts]
 * @returns {Promise<{ movies: Object[] }>}
 */
const buildHomeFeed = async ({ userId = null, nowMs = Date.now() } = {}) => {
  const [personal, collaborative, trending, fresh, exploration, progress] = await Promise.all([
    listPersonalSource(userId),
    listCollaborativeSource(userId),
    listTrendingSource(),
    listFreshSource(nowMs),
    listExplorationSource(userId),
    listWatchProgress(userId),
  ]);

  const watchedIds = new Set(
    (progress || []).filter((row) => row.watched).map((row) => row.movieId)
  );

  return assembleHomeFeed({
    personal,
    collaborative,
    trending,
    fresh,
    exploration,
    watchedIds,
  });
};

module.exports = {
  assembleHomeFeed,
  buildHomeFeed,
};
