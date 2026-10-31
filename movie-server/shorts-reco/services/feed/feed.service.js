'use strict';

const config = require('../../config');
const collections = require('../../config/collections');
const { createCatalogRepo } = require('../../repositories/catalog.repo');
const { createWatchStateRepo } = require('../../repositories/watchState.repo');
const { createProfileRepo } = require('../../repositories/profile.repo');
const { createStatsRepo } = require('../../repositories/stats.repo');
const { createFeedSessionRepo } = require('../../repositories/feedSession.repo');
const { createProfileHeatRepo } = require('../../repositories/profileHeat.repo');
const { createProfileSliceService } = require('../profileHeat/slice');
const { appendProfileHeat } = require('../profileHeat/attach');
const { topQualifyingMovies, confirmedActors, splitActorSlots } = require('../actors.service');
const { emptyProfile, hydrateProfile } = require('../profile.service');
const { planAnchors } = require('../anchors.service');
const { levelFor, buildSlotPlan } = require('./slotPlan');
const { buildFeed } = require('./feedBuilder');
const { createFeedSessionService, reuseStoredSession, rememberPosition } = require('./feedSession.service');
const { collect: collectProfile } = require('./sources/profile.source');

const movieType = collections.existing.shortsVideos.type;
const musicType = collections.existing.musicShorts.type;

/**
 * @param {Record<string, number>|undefined} map
 * @param {string} prefix
 * @param {number} [limit]
 */
const topValues = (map, prefix, limit = 5) =>
  Object.entries(map || {})
    .filter(([key, value]) => key.startsWith(prefix) && value > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([key]) => key.slice(prefix.length));

/**
 * @param {object|null} row
 * @param {object|null} sample
 */
const describeAnchor = (row, sample) => {
  if (!row) return null;
  const doc = sample || {};
  return {
    key: row.key,
    kind: row.kind,
    type: doc.type || (row.kind === 'movie' ? movieType : musicType),
    movieId: row.movieId != null ? row.movieId : (doc.movieId == null ? null : doc.movieId),
    musicKey: row.musicKey || doc.musicKey || null,
    artistId: row.artistId || doc.artistId || null,
    songGroupId: doc.songGroupId || null,
    contentType: doc.contentType || null,
    movieGenres: doc.movieGenres || [],
    movieCountries: doc.movieCountries || [],
    musicGenres: doc.musicGenres || [],
    musicCountries: doc.musicCountries || [],
    franchiseMovieIds: doc.franchiseMovieIds || [],
  };
};

/**
 * @param {object} anchor
 * @param {Function} query
 */
const loadAnchorSample = async (anchor, query) => {
  if (!anchor) return null;
  if (anchor.kind === 'movie' && anchor.movieId != null) {
    return (await query({ type: movieType, movieId: anchor.movieId }, 1))[0] || null;
  }
  if (anchor.kind === 'music' && anchor.musicKey) {
    return (await query({ musicKey: anchor.musicKey }, 1))[0] || null;
  }
  if (anchor.kind === 'artist' && anchor.artistId) {
    return (await query({ artistId: anchor.artistId }, 1))[0] || null;
  }
  return null;
};

/**
 * @param {object} profile
 * @param {{ findActorsForMovies: Function }} catalog
 * @param {number} slotCount
 */
const actorQueueFor = async (profile, catalog, slotCount) => {
  if (!slotCount) return [];
  const qualifying = topQualifyingMovies(profile.longTerm.movieEngagementRaw);
  const movieIds = qualifying.map((row) => Number(row.movieId)).filter((id) => Number.isFinite(id));
  const found = movieIds.length ? await catalog.findActorsForMovies(movieIds) : new Map();
  const movies = qualifying.map((row) => ({
    ...row,
    actors: found.get(Number(row.movieId)) || [],
  }));
  const assignment = splitActorSlots(confirmedActors(movies, profile.longTerm.actorPenalty).scores, slotCount);
  const queue = [];
  Object.keys(assignment).forEach((id) => {
    for (let i = 0; i < assignment[id]; i += 1) queue.push(id);
  });
  return queue;
};

/**
 * Last served feed rows that already have a watch. Order stays oldest to newest.
 * @param {object[]|undefined} sessionItems
 * @param {Map<string, object>} watches
 */
const fatigueRows = (sessionItems, watches) => {
  const rows = [];
  const items = sessionItems || [];
  for (let i = items.length - 1; i >= 0 && rows.length < config.fatigueServedCount; i -= 1) {
    const watch = watches.get(items[i].shortId);
    if (!watch || watch.isProvisional === true) continue;
    rows.push({ anchorKey: items[i].anchorKey, bestPassRatio: watch.bestPassRatio });
  }
  return rows.reverse();
};

/**
 * @param {object} profile
 */
const userTopsOf = (profile) => {
  const countries = topValues(profile.longTerm.countries, 'c:');
  return {
    genres: topValues(profile.longTerm.genres, 'g:'),
    countries,
    musicGenres: topValues(profile.longTerm.musicGenres, 'mg:'),
    musicCountries: countries,
  };
};

/**
 * @param {object} options
 */
/**
 * @param {object} profile
 * @returns {Record<string, number>}
 */
const genreScoresOf = (profile) => {
  const longTerm = profile && profile.longTerm ? profile.longTerm : {};
  return {
    ...(longTerm.genres || {}),
    ...(longTerm.musicGenres || {}),
  };
};

const createFeedService = (options = {}) => {
  const catalog = options.catalogRepo || createCatalogRepo(options.connection);
  const watchesRepo = options.watchRepo || createWatchStateRepo(options.connection);
  const profiles = options.profileRepo || createProfileRepo(options.connection);
  const stats = options.statsRepo || createStatsRepo(options.connection);
  const sessionRepo = options.sessionRepo || createFeedSessionRepo(options.connection);
  const sessions = createFeedSessionService(sessionRepo, { now: options.now });
  const query = (filter, limit, sort) => catalog.findMatching(filter, limit, sort);
  const clock = { current: new Date() };
  const heatRepo = options.profileHeatRepo
    || (options.connection ? createProfileHeatRepo(options.connection) : null);
  const profileSlice = options.profileSlice
    || (heatRepo
      ? createProfileSliceService({ heatRepo, catalogRepo: catalog, now: () => clock.current })
      : null);

  return {
    /**
     * @param {{ userId?: string|null, sessionId?: string, position?: number, limit?: number, now?: Date }} input
     */
    async serveFeed(input) {
      const request = input || {};
      clock.current = request.now || new Date();
      const userId = request.userId ? String(request.userId) : null;
      const limit = request.limit || config.feedBatchSize;
      let storedSession = request.sessionId ? await sessionRepo.findById(request.sessionId) : null;
      if (storedSession && userId && storedSession.userId && storedSession.userId !== userId) {
        storedSession = null;
      }
      const storedProfile = userId ? await profiles.findByUserId(userId) : null;
      const profileVersion = storedProfile && Number.isInteger(storedProfile.version)
        ? storedProfile.version
        : 0;
      const raised = rememberPosition(storedSession, request.position);
      const reused = reuseStoredSession(
        storedSession,
        request.position,
        limit,
        profileVersion,
        clock.current
      );
      if (reused) {
        if (raised) await sessionRepo.save(storedSession);
        return reused;
      }

      let focusItem = null;
      if (request.focus && !storedSession) {
        const doc = await catalog.findByClientShortId(request.focus);
        if (doc && doc.shortId) {
          focusItem = {
            shortId: doc.shortId,
            slot: 'explore',
            anchorKey: null,
            type: doc.type,
            contentType: doc.contentType == null ? null : doc.contentType,
            movieId: doc.movieId == null ? null : doc.movieId,
            artistId: doc.artistId || null,
            musicKey: doc.musicKey || null,
            repeat: false,
          };
        }
      }

      const watchList = userId ? await watchesRepo.listByUser(userId, config.watchStateReadLimit) : [];
      const watchMap = new Map(watchList.map((row) => [row.shortId, row]));
      const profile = userId
        ? hydrateProfile(storedProfile, userId, clock.current)
        : emptyProfile('guest', clock.current);
      const viewCount = watchList.length;
      const cold = !userId || viewCount < config.coldStartMinViews;
      const planned = planAnchors({
        items: profile.session.items || [],
        multipliers: profile.anchorMultipliers,
        locks: profile.anchorLocks,
        fatigue: profile.anchorFatigue,
        pinned: profile.anchorPinned,
        served: fatigueRows(storedSession && storedSession.items, watchMap),
        now: clock.current,
      });
      if (userId) {
        profile.anchorMultipliers = planned.multipliers;
        profile.anchorLocks = planned.locks;
        profile.anchorFatigue = planned.fatigue;
        profile.anchorPinned = planned.pinned;
        profile.updatedAt = clock.current;
        await profiles.save(profile);
      }

      const popular = await stats.listTop(config.candidateFetchLimit);
      const popularIds = popular.map((row) => row.shortId).filter(Boolean);
      const statsByShortId = new Map(popular.map((row) => [row.shortId, row]));
      const finish = (built, page) => appendProfileHeat(built, {
        select: profileSlice ? (query) => profileSlice.selectForUser(query) : null,
        userId,
        genreScores: genreScoresOf(profile),
        watches: watchMap,
        exclude: page && page.exclude,
        logger: options.logger || null,
      });
      return sessions.serve({
        sessionId: request.sessionId,
        userId,
        position: request.position,
        limit,
        profileVersion,
        focusItem,
        build: async (page) => {
          if (cold) {
            const coldPool = await query({}, config.similarFetchLimit, { catalogAddedAt: -1 });
            const profileDocs = userId && viewCount > 0
              ? await collectProfile({
                query,
                fetchLimit: config.candidateFetchLimit,
                similarLimit: config.similarFetchLimit,
                userTops: userTopsOf(profile),
                profile,
                statsByShortId,
                now: clock.current,
              })
              : [];
            return finish(await buildFeed({
              ...page,
              cold: true,
              coldPool,
              popularIds,
              profileDocs,
              viewCount,
              limit,
              now: clock.current,
            }), page);
          }

          const levelName = levelFor(planned.levelStrength).name;
          const plan = buildSlotPlan({
            strength: planned.levelStrength,
            dominant: planned.dominant,
            actorSlots: config.actorSlotsByLevel[levelName] || 0,
          });
          const primary = planned.active[0] || null;
          const anchor = describeAnchor(primary, await loadAnchorSample(primary, query));
          return finish(await buildFeed({
            ...page,
            slots: plan.slots,
            anchor,
            topAnchorKeys: planned.active.slice(0, 2).map((row) => row.key),
            actorQueue: await actorQueueFor(
              profile,
              catalog,
              plan.slots.filter((slot) => slot.source === 'actor').length
            ),
            engagedMovieIds: watchList.map((row) => row.movieId).filter((id) => id != null),
            watches: watchMap,
            profile,
            userTops: userTopsOf(profile),
            popularIds,
            statsByShortId,
            query,
            fetchLimit: config.candidateFetchLimit,
            similarLimit: config.similarFetchLimit,
            limit,
            now: clock.current,
            logger: options.logger || null,
          }), page);
        },
      });
    },
  };
};

module.exports = {
  createFeedService,
  describeAnchor,
  fatigueRows,
  topValues,
};
