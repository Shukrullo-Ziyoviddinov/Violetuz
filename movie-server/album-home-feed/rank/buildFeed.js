/**
 * Besh albom manbasi yig'iladi.
 * HTTP yo'q. Keshga yozilmaydi. music-home-feed chaqirilmaydi.
 *
 * @module album-home-feed/rank/buildFeed
 */

'use strict';

const { albumHomeFeedWeights } = require('../config/albumHomeFeedWeights');
const { listListenProgress } = require('../repositories/listenProgress.read');
const { findRankMetaByIds } = require('../repositories/catalog.read');
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
 * Katalogda yo'q id lenta tashqarisida qoladi.
 *
 * @param {Object} input
 * @returns {Promise<{ albums: Object[] }>}
 */
const assembleAlbumFeed = async ({
  personal,
  collaborative = [],
  trending,
  fresh,
  exploration,
  listenedIds,
}) => {
  const scored = scoreAndDedupe(
    [
      normalizeSourceRows(personal, { perCategory: true }),
      normalizeSourceRows(collaborative, { perCategory: false }),
      normalizeSourceRows(trending, { perCategory: true }),
      normalizeSourceRows(fresh, { perCategory: false }),
      normalizeSourceRows(exploration, { perCategory: false }),
    ],
    listenedIds
  );

  const meta = await findRankMetaByIds(scored.map((row) => row.contentId));
  const withMeta = [];
  for (const row of scored) {
    const info = meta.get(row.contentId);
    if (!info) continue;
    withMeta.push({
      ...row,
      category: info.category,
      artists: info.artistId ? [info.artistId] : [],
    });
  }

  const mixed = mixSlots(withMeta);
  const diversified = diversifyFeed(mixed, albumHomeFeedWeights.feedSize);

  const albums = diversified.map((row, index) => ({
    contentId: row.contentId,
    category: row.category,
    position: index + 1,
    score: row.finalScore,
    sourceType: row.sourceType,
    listened: row.listened,
  }));

  return { albums };
};

/**
 * Login yoki foydalanuvchisiz katalog. Mehmon localHistory bu funksiyaga kirmaydi.
 *
 * @param {{ userId?: string|import('mongoose').Types.ObjectId|null, nowMs?: number }} [opts]
 * @returns {Promise<{ albums: Object[] }>}
 */
const buildAlbumFeed = async ({ userId = null, nowMs = Date.now() } = {}) => {
  const [personal, collaborative, trending, fresh, progress] = await Promise.all([
    listPersonalSource(userId),
    listCollaborativeSource(userId),
    listTrendingSource(),
    listFreshSource(nowMs),
    listListenProgress(userId),
  ]);

  const listenedIds = new Set(
    (progress || []).filter((row) => row.listened).map((row) => row.contentId)
  );
  const exploration = await listExplorationSource(userId, { listenedIds });

  return assembleAlbumFeed({
    personal,
    collaborative,
    trending,
    fresh,
    exploration,
    listenedIds,
  });
};

module.exports = {
  assembleAlbumFeed,
  buildAlbumFeed,
};
