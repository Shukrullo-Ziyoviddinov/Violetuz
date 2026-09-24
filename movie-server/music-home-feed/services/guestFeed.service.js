/**
 * Mehmon "Sizga mos musiqalar".
 * POST localHistory. Hisob xotirada. music_home_feed_cache va bo'lim jadvallariga yozilmaydi.
 * Tarixdan faqat contentType music. Tinglandi — isListenGateOpen.
 * Shaxsiy cache yo'q.
 *
 * @module music-home-feed/services/guestFeed.service
 */

'use strict';

const { sanitizeLocalHistory } = require('../../recommendation-music/services/guestAffinityBuilder.service');
const { badRequest } = require('../../utils/errors');
const { musicHomeFeedWeights } = require('../config/musicHomeFeedWeights');
const { isMusicContentType } = require('../repositories/musicContent');
const { isListenedTrack } = require('../repositories/listened');
const { mapDurationByIds } = require('../repositories/catalog.read');
const { listTrendingSource } = require('../sources/trending.source');
const { listFreshSource } = require('../sources/fresh.source');
const { listExplorationSource } = require('../sources/exploration.source');
const { listCollaborativeFromSeeds } = require('../sources/collaborative.source');
const { assembleMusicFeed } = require('../rank/buildFeed');

/**
 * Brauzer qatoridan sekundani qayta tiklaydi: foiz × katalog davomiyligi.
 * Formula o'zi o'zgarmaydi.
 *
 * @param {Array<{ m: string, ct: string, r: number }>} events
 * @param {Map<string, number|null>} durationById
 * @returns {{ listenedIds: Set<string>, listenedOrder: string[] }}
 */
const listenedIdsFromMusicEvents = (events, durationById) => {
  const listenedIds = new Set();
  const listenedOrder = [];

  for (const event of events || []) {
    if (!isMusicContentType(event.ct)) continue;
    const contentId = String(event.m || '').trim();
    if (!contentId) continue;
    const durationSec = durationById.has(contentId) ? durationById.get(contentId) : null;
    const completion = Number(event.r) || 0;
    const listenedSeconds = durationSec ? completion * durationSec : 0;
    if (!isListenedTrack(listenedSeconds, completion, durationSec)) continue;
    if (listenedIds.has(contentId)) continue;
    listenedIds.add(contentId);
    listenedOrder.push(contentId);
  }

  return { listenedIds, listenedOrder };
};

/**
 * @param {{ localHistory?: unknown, nowMs?: number }} [opts]
 * @returns {Promise<{ tracks: Object[], source: 'guest' }>}
 */
const buildGuestMusicFeed = async ({ localHistory = null, nowMs = Date.now() } = {}) => {
  const parsed = sanitizeLocalHistory(localHistory, { nowMs });
  if (!parsed.ok) {
    throw badRequest(parsed.error);
  }

  const musicEvents = parsed.events.filter((event) => isMusicContentType(event.ct));
  const durations = await mapDurationByIds(musicEvents.map((event) => event.m));
  const { listenedIds, listenedOrder } = listenedIdsFromMusicEvents(musicEvents, durations);
  const seedTake = musicHomeFeedWeights.coOccurrence.recentSeedTracks;
  const seeds = listenedOrder.slice(-Math.max(1, seedTake));

  const [collaborative, trending, fresh, exploration] = await Promise.all([
    listCollaborativeFromSeeds(seeds),
    listTrendingSource(),
    listFreshSource(nowMs),
    listExplorationSource(null, { listenedIds }),
  ]);

  const feed = await assembleMusicFeed({
    personal: [],
    collaborative,
    trending,
    fresh,
    exploration,
    listenedIds,
  });

  return {
    tracks: feed.tracks,
    source: 'guest',
  };
};

module.exports = {
  listenedIdsFromMusicEvents,
  buildGuestMusicFeed,
};
