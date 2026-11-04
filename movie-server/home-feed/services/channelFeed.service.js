/**
 * Kanal "Tavsiya etamiz".
 * Nomzodlar shu kanal kino id lari bilan kesiladi, keyin umumiy assembleHomeFeed ishlaydi.
 * home_feed_cache o'qilmaydi va yozilmaydi.
 *
 * @module home-feed/services/channelFeed.service
 */

'use strict';

const { sanitizeLocalHistory } = require('../../recommendation/services/guestAffinityBuilder.service');
const { badRequest } = require('../../utils/errors');
const { homeFeedWeights } = require('../config/homeFeedWeights');
const { listWatchProgress, isWatchedProgress } = require('../repositories/watchProgress.read');
const { listPersonalSource } = require('../sources/personal.source');
const { listTrendingSource } = require('../sources/trending.source');
const { listFreshSource } = require('../sources/fresh.source');
const { listExplorationSource } = require('../sources/exploration.source');
const {
  listCollaborativeSource,
  listCollaborativeFromSeeds,
} = require('../sources/collaborative.source');
const { assembleHomeFeed } = require('../rank/buildFeed');
const { loadChannelMovieIdSet } = require('../channel/allowIds');

const emptyFeed = (source) => ({ movies: [], source });

/**
 * @param {Set<string>} allowed
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {number} nowMs
 */
const buildLoginChannelFeed = async (allowed, userId, nowMs) => {
  const [personal, collaborative, trending, fresh, exploration, progress] = await Promise.all([
    listPersonalSource(userId, allowed),
    listCollaborativeSource(userId, allowed),
    listTrendingSource(allowed),
    listFreshSource(nowMs, allowed),
    listExplorationSource(userId, { allowedMovieIds: allowed }),
    listWatchProgress(userId),
  ]);

  const watchedIds = new Set(
    (progress || []).filter((row) => row.watched).map((row) => row.movieId)
  );

  const feed = await assembleHomeFeed({
    personal,
    collaborative,
    trending,
    fresh,
    exploration,
    watchedIds,
  });

  return {
    movies: feed.movies,
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
    listCollaborativeFromSeeds(seeds, allowed),
    listTrendingSource(allowed),
    listFreshSource(nowMs, allowed),
    listExplorationSource(null, { watchedIds, allowedMovieIds: allowed }),
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
    source: 'channel_guest',
  };
};

/**
 * @param {{ channelId: string, userId: string|import('mongoose').Types.ObjectId, nowMs?: number }} opts
 */
const getChannelHomeFeed = async ({ channelId, userId, nowMs = Date.now() }) => {
  const allowed = await loadChannelMovieIdSet(channelId);
  if (!allowed.size) return emptyFeed('channel');
  return buildLoginChannelFeed(allowed, userId, nowMs);
};

/**
 * @param {{ channelId: string, localHistory?: unknown, nowMs?: number }} opts
 */
const getChannelGuestHomeFeed = async ({ channelId, localHistory = null, nowMs = Date.now() }) => {
  const allowed = await loadChannelMovieIdSet(channelId);
  if (!allowed.size) return emptyFeed('channel_guest');
  return buildGuestChannelFeed(allowed, localHistory, nowMs);
};

module.exports = {
  getChannelHomeFeed,
  getChannelGuestHomeFeed,
};
