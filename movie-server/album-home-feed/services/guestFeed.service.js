/**
 * Mehmon "Siz uchun albomlar".
 * POST localHistory. Hisob xotirada.
 * album_home_feed_cache va bo'lim jadvallariga yozilmaydi.
 * Tarixdan faqat contentType album. Shaxsiy cache yo'q.
 * music-home-feed chaqirilmaydi.
 *
 * Albom katalogida durationSec yo'q, shuning uchun foizdan sekund tiklanmaydi.
 * Mehmon qatori clientda tinglash eshigi ochilgach yoziladi.
 *
 * @module album-home-feed/services/guestFeed.service
 */

'use strict';

const { sanitizeLocalHistory } = require('../../recommendation-music/services/guestAffinityBuilder.service');
const { badRequest } = require('../../utils/errors');
const { albumHomeFeedWeights } = require('../config/albumHomeFeedWeights');
const { isAlbumContentType } = require('../repositories/albumContent');
const { listTrendingSource } = require('../sources/trending.source');
const { listFreshSource } = require('../sources/fresh.source');
const { listExplorationSource } = require('../sources/exploration.source');
const { listCollaborativeFromSeeds } = require('../sources/collaborative.source');
const { assembleAlbumFeed } = require('../rank/buildFeed');

/**
 * @param {Array<{ m: string, ct: string, r: number }>} events
 * @returns {{ listenedIds: Set<string>, listenedOrder: string[] }}
 */
const listenedIdsFromAlbumEvents = (events) => {
  const listenedIds = new Set();
  const listenedOrder = [];

  for (const event of events || []) {
    if (!isAlbumContentType(event.ct)) continue;
    const contentId = String(event.m || '').trim();
    if (!contentId || listenedIds.has(contentId)) continue;
    listenedIds.add(contentId);
    listenedOrder.push(contentId);
  }

  return { listenedIds, listenedOrder };
};

/**
 * @param {{ localHistory?: unknown, nowMs?: number }} [opts]
 * @returns {Promise<{ albums: Object[], source: 'guest' }>}
 */
const buildGuestAlbumFeed = async ({ localHistory = null, nowMs = Date.now() } = {}) => {
  const parsed = sanitizeLocalHistory(localHistory, { nowMs });
  if (!parsed.ok) {
    throw badRequest(parsed.error);
  }

  const albumEvents = parsed.events.filter((event) => isAlbumContentType(event.ct));
  const { listenedIds, listenedOrder } = listenedIdsFromAlbumEvents(albumEvents);
  const seedTake = albumHomeFeedWeights.coOccurrence.recentSeedAlbums;
  const seeds = listenedOrder.slice(-Math.max(1, seedTake));

  const [collaborative, trending, fresh, exploration] = await Promise.all([
    listCollaborativeFromSeeds(seeds),
    listTrendingSource(),
    listFreshSource(nowMs),
    listExplorationSource(null, { listenedIds }),
  ]);

  const feed = await assembleAlbumFeed({
    personal: [],
    collaborative,
    trending,
    fresh,
    exploration,
    listenedIds,
  });

  return {
    albums: feed.albums,
    source: 'guest',
  };
};

module.exports = {
  listenedIdsFromAlbumEvents,
  buildGuestAlbumFeed,
};
