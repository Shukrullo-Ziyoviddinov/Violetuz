'use strict';

const config = require('../config');
const collections = require('../config/collections');
const { createTtlCache } = require('../utils/ttlCache');
const { createCatalogRepo } = require('../repositories/catalog.repo');
const { createEventsRepo } = require('../repositories/events.repo');
const { createWatchStateRepo } = require('../repositories/watchState.repo');
const { createProfileRepo } = require('../repositories/profile.repo');
const { createStatsRepo } = require('../repositories/stats.repo');
const { validateWatchEvent } = require('../validators/events.validator');
const { applyWatch } = require('./aggregate');
const { topQualifyingMovies, confirmedActors } = require('./actors.service');
const {
  hydrateProfile,
  decayProfile,
  applyScoreChange,
  applyActorPenalty,
  sessionRefs,
  pushSession,
} = require('./profile.service');

const movieShortType = collections.existing.shortsVideos.type;

/**
 * @param {unknown} userId
 * @returns {string|null}
 */
const normalizeUserId = (userId) => {
  if (userId == null || userId === '') return null;
  const text = String(userId).trim();
  return text || null;
};

/**
 * @param {Console|null|undefined} logger
 */
const wrapLogger = (logger) => {
  const base = logger || console;
  return {
    error(message, meta) {
      if (typeof base.error !== 'function') return;
      if (meta === undefined) base.error(message);
      else base.error(message, meta);
    },
  };
};

/**
 * @param {{
 *   connection?: import('mongoose').Connection|import('mongodb').Db,
 *   logger?: Console,
 *   catalogRepo?: object,
 *   eventsRepo?: object,
 *   watchRepo?: object,
 *   profileRepo?: object,
 *   statsRepo?: object,
 *   now?: () => Date,
 * }} options
 */
const createWatchEventService = (options) => {
  const logger = wrapLogger(options.logger);
  const catalogRepo = options.catalogRepo || createCatalogRepo(options.connection);
  const eventsRepo = options.eventsRepo || createEventsRepo(options.connection);
  const watchRepo = options.watchRepo || createWatchStateRepo(options.connection);
  const profileRepo = options.profileRepo || createProfileRepo(options.connection);
  const statsRepo = options.statsRepo || createStatsRepo(options.connection);
  const now = options.now || (() => new Date());
  const actorCache = createTtlCache(config.actorCacheTtlMs, () => now().getTime());
  const tails = new Map();

  const enqueue = (userId, fn) => {
    const previous = tails.get(userId) || Promise.resolve();
    const run = previous.then(fn, fn);
    const tail = run.then(() => {}, () => {});
    tails.set(userId, tail);
    tail.finally(() => {
      if (tails.get(userId) === tail) tails.delete(userId);
    });
    return run;
  };

  /**
   * @param {Record<string, number>} engagement
   * @param {object} catalog
   */
  const actorsForMovies = async (engagement, catalog) => {
    /** @type {Record<string, Array<number|string>>} */
    const byMovie = {};
    const missing = [];
    const movieIds = Object.keys(engagement);
    for (let i = 0; i < movieIds.length; i += 1) {
      const key = movieIds[i];
      const cached = actorCache.get(key);
      if (cached) byMovie[key] = cached;
      else missing.push(Number(key));
    }

    if (missing.length > 0 && catalogRepo.findActorsForMovies) {
      const found = await catalogRepo.findActorsForMovies(missing);
      for (let i = 0; i < missing.length; i += 1) {
        const movieId = missing[i];
        const actors = found.get(movieId) || [];
        actorCache.set(String(movieId), actors);
        byMovie[String(movieId)] = actors;
      }
    }

    if (catalog.type === movieShortType && catalog.movieId != null) {
      const actors = Array.isArray(catalog.actors) ? catalog.actors : [];
      byMovie[String(catalog.movieId)] = actors;
      actorCache.set(String(catalog.movieId), actors);
    }
    return byMovie;
  };

  /**
   * @param {string} userId
   * @param {object} event
   * @param {object} catalog
   */
  const applyEvent = async (userId, event, catalog) => {
    const previousWatch = await watchRepo.findOne(userId, catalog.shortId);
    const storedProfile = await profileRepo.findByUserId(userId);
    const profile = hydrateProfile(storedProfile, userId, event.ts);
    const decayFactor = decayProfile(profile, event.ts);
    const oldScore = previousWatch ? previousWatch.score || 0 : 0;
    const aggregate = applyWatch(previousWatch, event);

    applyScoreChange(profile, catalog, oldScore, aggregate.score, decayFactor);

    if (catalog.type === movieShortType && catalog.movieId != null) {
      const actorsByMovie = await actorsForMovies(profile.longTerm.movieEngagementRaw, catalog);
      const qualifying = topQualifyingMovies(
        profile.longTerm.movieEngagementRaw,
        actorsByMovie
      );
      const confirmed = confirmedActors(qualifying, profile.longTerm.actorPenalty);
      const seenActors = new Set();
      const onThisMovie = [];
      const listed = Array.isArray(catalog.actors) ? catalog.actors : [];
      for (let i = 0; i < listed.length; i += 1) {
        const actorId = String(listed[i]);
        if (!actorId || seenActors.has(actorId) || !confirmed.ids.has(actorId)) continue;
        seenActors.add(actorId);
        onThisMovie.push(actorId);
      }
      applyActorPenalty(profile, onThisMovie, oldScore, aggregate.score, decayFactor);
    }

    profile.session = pushSession(profile.session, {
      shortId: catalog.shortId,
      refs: sessionRefs(catalog),
      score: aggregate.score,
      ts: event.ts,
    });
    profile.updatedAt = event.ts;

    const watch = {
      userId,
      shortId: catalog.shortId,
      bestPassRatio: aggregate.bestPassRatio,
      totalPlayedMs: aggregate.totalPlayedMs,
      completions: aggregate.completions,
      liked: aggregate.liked,
      commented: aggregate.commented,
      shared: aggregate.shared,
      firstSeenAt: previousWatch ? previousWatch.firstSeenAt : event.ts,
      lastSeenAt: event.ts,
      score: aggregate.score,
      movieId: catalog.movieId == null ? null : catalog.movieId,
      musicKey: catalog.musicKey || null,
      artistId: catalog.artistId || null,
      type: catalog.type,
    };

    await watchRepo.save(watch);
    await profileRepo.save(profile);
    await statsRepo.applyDelta(
      catalog.shortId,
      {
        views: 1,
        completions: aggregate.completions - (previousWatch ? previousWatch.completions || 0 : 0),
        likes: aggregate.liked && !(previousWatch && previousWatch.liked) ? 1 : 0,
        comments: aggregate.commented && !(previousWatch && previousWatch.commented) ? 1 : 0,
        shares: aggregate.shared && !(previousWatch && previousWatch.shared) ? 1 : 0,
      },
      event.ts
    );

    return { status: 'ok', score: aggregate.score, shortId: catalog.shortId };
  };

  /**
   * @param {{ userId?: unknown, body?: object }} input
   */
  const ingest = async (input) => {
    const userId = normalizeUserId(input && input.userId);
    if (!userId) return { status: 'ignored' };

    const validated = validateWatchEvent(input.body, now());
    if (!validated.ok) return { status: 'invalid', errors: validated.errors };

    const catalog = await catalogRepo.findByClientShortId(validated.value.shortId);
    if (!catalog) return { status: 'not_found' };

    const accepted = await eventsRepo.insertIfNew(validated.value.eventId, validated.value.ts);
    if (!accepted) return { status: 'duplicate' };

    try {
      return await enqueue(userId, () => applyEvent(userId, validated.value, catalog));
    } catch (error) {
      await eventsRepo.remove(validated.value.eventId);
      logger.error(
        'shorts-reco watch event failed',
        error && error.message ? error.message : error
      );
      throw error;
    }
  };

  return { ingest };
};

module.exports = {
  createWatchEventService,
};
