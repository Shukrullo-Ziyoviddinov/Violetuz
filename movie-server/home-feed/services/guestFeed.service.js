/**
 * Mehmon "Siz uchun".
 * POST localHistory. Hisob xotirada. home_feed_cache va bo'lim jadvallariga yozilmaydi.
 * Shaxsiy cache yo'q — bo'sh tarixda trend, yangi kino va exploration qoladi.
 *
 * @module home-feed/services/guestFeed.service
 */

'use strict';

const { sanitizeLocalHistory } = require('../../recommendation/services/guestAffinityBuilder.service');
const { badRequest } = require('../../utils/errors');
const { isWatchedProgress } = require('../repositories/watchProgress.read');
const { listTrendingSource } = require('../sources/trending.source');
const { listFreshSource } = require('../sources/fresh.source');
const { listExplorationSource } = require('../sources/exploration.source');
const { listCollaborativeFromSeeds } = require('../sources/collaborative.source');
const { assembleHomeFeed } = require('../rank/buildFeed');
const { homeFeedWeights } = require('../config/homeFeedWeights');

/**
 * @param {{ localHistory?: unknown, nowMs?: number }} [opts]
 * @returns {Promise<{ movies: Object[], source: 'guest' }>}
 */
const buildGuestHomeFeed = async ({ localHistory = null, nowMs = Date.now() } = {}) => {
  const parsed = sanitizeLocalHistory(localHistory, { nowMs });
  if (!parsed.ok) {
    throw badRequest(parsed.error);
  }

  const watchedIds = new Set();
  const watchedOrder = [];
  for (const event of parsed.events) {
    if (!isWatchedProgress(0, event.r)) continue;
    const movieId = String(event.m);
    watchedIds.add(movieId);
    watchedOrder.push(movieId);
  }
  const seedTake = homeFeedWeights.coOccurrence.recentSeedMovies;
  const seeds = watchedOrder.slice(-Math.max(1, seedTake));

  const [collaborative, trending, fresh, exploration] = await Promise.all([
    listCollaborativeFromSeeds(seeds),
    listTrendingSource(),
    listFreshSource(nowMs),
    listExplorationSource(null, { watchedIds }),
  ]);

  const feed = await assembleHomeFeed({
    personal: [],
    collaborative,
    trending,
    fresh,
    exploration,
    watchedIds,
  });

  return {
    movies: feed.movies,
    source: 'guest',
  };
};

/**
 * Mehmon lentasidan sahifa. Javobda faqat so'ralgan bo'lak.
 *
 * @param {{ localHistory?: unknown, offset?: number, limit?: number, excludeIds?: string[], nowMs?: number }} [opts]
 * @returns {Promise<{ movies: Object[], hasMore: boolean, source: 'guest' }>}
 */
const buildGuestHomeFeedPage = async ({
  localHistory = null,
  offset = 0,
  limit = 10,
  excludeIds = [],
  nowMs = Date.now(),
} = {}) => {
  const feed = await buildGuestHomeFeed({ localHistory, nowMs });
  const exclude = new Set(
    (Array.isArray(excludeIds) ? excludeIds : []).map((id) => String(id).trim()).filter(Boolean)
  );
  const filtered = feed.movies.filter((row) => !exclude.has(String(row.movieId)));
  const skip = Math.max(0, Number(offset) || 0);
  const take = Math.min(40, Math.max(1, Number(limit) || 10));
  return {
    movies: filtered.slice(skip, skip + take),
    hasMore: skip + take < filtered.length,
    source: 'guest',
  };
};

module.exports = {
  buildGuestHomeFeed,
  buildGuestHomeFeedPage,
};
