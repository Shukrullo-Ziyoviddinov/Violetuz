/**
 * Kanal "Siz uchun tavsiyalar".
 * Nomzodlar shu kanal qo'shiq id lari bilan kesiladi, keyin umumiy assembleMusicFeed ishlaydi.
 * music_home_feed_cache o'qilmaydi va yozilmaydi.
 *
 * @module music-home-feed/services/channelFeed.service
 */

'use strict';

const { sanitizeLocalHistory } = require('../../recommendation-music/services/guestAffinityBuilder.service');
const { badRequest } = require('../../utils/errors');
const { musicHomeFeedWeights } = require('../config/musicHomeFeedWeights');
const { isMusicContentType } = require('../repositories/musicContent');
const { mapDurationByIds } = require('../repositories/catalog.read');
const { listListenProgress } = require('../repositories/listenProgress.read');
const { listPersonalSource } = require('../sources/personal.source');
const { listTrendingSource } = require('../sources/trending.source');
const { listFreshSource } = require('../sources/fresh.source');
const { listExplorationSource } = require('../sources/exploration.source');
const {
  listCollaborativeSource,
  listCollaborativeFromSeeds,
} = require('../sources/collaborative.source');
const { assembleMusicFeed } = require('../rank/buildFeed');
const { listenedIdsFromMusicEvents } = require('./guestFeed.service');
const { loadChannelMusicIdSet } = require('../channel/allowIds');

const emptyFeed = (source) => ({ tracks: [], source });

/**
 * @param {Set<string>} allowed
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {number} nowMs
 */
const buildLoginChannelFeed = async (allowed, userId, nowMs) => {
  const [personal, collaborative, trending, fresh, progress] = await Promise.all([
    listPersonalSource(userId, allowed),
    listCollaborativeSource(userId, allowed),
    listTrendingSource(allowed),
    listFreshSource(nowMs, allowed),
    listListenProgress(userId),
  ]);

  const listenedIds = new Set(
    (progress || []).filter((row) => row.listened).map((row) => row.contentId)
  );
  const exploration = await listExplorationSource(userId, { listenedIds, allowedContentIds: allowed });
  const feed = await assembleMusicFeed({
    personal,
    collaborative,
    trending,
    fresh,
    exploration,
    listenedIds,
  });

  return {
    tracks: feed.tracks,
    source: 'channel',
  };
};

/**
 * @param {Set<string>} allowed
 * @param {unknown} localHistory
 * @param {number} nowMs
 */
const buildGuestChannelFeed = async (allowed, localHistory, nowMs) => {
  const parsed = sanitizeLocalHistory(localHistory, { nowMs });
  if (!parsed.ok) throw badRequest(parsed.error);

  const musicEvents = parsed.events.filter((event) => isMusicContentType(event.ct));
  const durations = await mapDurationByIds(musicEvents.map((event) => event.m));
  const { listenedIds, listenedOrder } = listenedIdsFromMusicEvents(musicEvents, durations);
  const seedTake = musicHomeFeedWeights.coOccurrence.recentSeedTracks;
  const seeds = listenedOrder.slice(-Math.max(1, seedTake));

  const [collaborative, trending, fresh, exploration] = await Promise.all([
    listCollaborativeFromSeeds(seeds, allowed),
    listTrendingSource(allowed),
    listFreshSource(nowMs, allowed),
    listExplorationSource(null, { listenedIds, allowedContentIds: allowed }),
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
    source: 'channel_guest',
  };
};

/**
 * @param {{ channelId: string, userId: string|import('mongoose').Types.ObjectId, nowMs?: number }} opts
 */
const getChannelMusicFeed = async ({ channelId, userId, nowMs = Date.now() }) => {
  const allowed = await loadChannelMusicIdSet(channelId);
  if (!allowed.size) return emptyFeed('channel');
  return buildLoginChannelFeed(allowed, userId, nowMs);
};

/**
 * @param {{ channelId: string, localHistory?: unknown, nowMs?: number }} opts
 */
const getChannelGuestMusicFeed = async ({ channelId, localHistory = null, nowMs = Date.now() }) => {
  const allowed = await loadChannelMusicIdSet(channelId);
  if (!allowed.size) return emptyFeed('channel_guest');
  return buildGuestChannelFeed(allowed, localHistory, nowMs);
};

module.exports = {
  getChannelMusicFeed,
  getChannelGuestMusicFeed,
};
