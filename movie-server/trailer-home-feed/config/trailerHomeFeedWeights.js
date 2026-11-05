'use strict';

/** Initial tuning values, not measured production optima. All ratios are 0..1. */
const sourceTypes = ['personal', 'trending', 'fresh', 'exploration'];

const trailerHomeFeedWeights = {
  catalog: {
    trailersField: 'trailersVideo',
    movieFields: {
      id: 'id',
      genres: 'filterGenre',
      country: 'filterCountry',
      actors: 'actors',
      channel: 'channelId',
    },
    trailerFields: { id: 'id', video: 'trailers', image: 'trillerimg', title: 'title' },
    // First valid timestamp wins. Publication time is not the movie's release year.
    uploadedAtFields: ['createdAt', 'uploadedAt'],
    identityFields: ['movieId', 'trailerId'],
  },

  feed: {
    size: 40,
    pageSize: 10,
    maxPageSize: 40,
    // Keep a session's ordering stable; rotate exploration between sessions.
    sessionTtlMs: 30 * 60 * 1000,
    cacheTtlMs: 5 * 60 * 1000,
  },

  candidates: {
    maxTotal: 400,
    limits: { personal: 160, trending: 100, fresh: 80, exploration: 100 },
    // Apply before truncating the pool, so high-volume channels cannot fill it.
    maxPerChannelPerSource: 12,
    relaxChannelCapWhenSparse: true,
    trendingMaxAgeMs: 30 * 60 * 1000,
    exploration: {
      preferUnderexposedChannels: true,
      rotateChannelsBetweenSessions: true,
      requireMinimumMovieRating: false,
      exposureWindowDays: 30,
      exposureMaxAgeMs: 15 * 60 * 1000,
    },
  },

  personalization: {
    // Count distinct meaningfully watched trailers, not opens, events or retries.
    confidenceUnit: 'distinctMeaningfullyWatchedTrailers',
    confidenceAnchors: [
      { count: 0, shares: { personal: 0, trending: 0.6, fresh: 0.2, exploration: 0.2 } },
      { count: 5, shares: { personal: 0.3, trending: 0.4, fresh: 0.15, exploration: 0.15 } },
      { count: 20, shares: { personal: 0.6, trending: 0.2, fresh: 0.1, exploration: 0.1 } },
    ],
    interpolation: 'linear',
    // Existing movie taste is read-only and needs its own confidence check.
    movieTastePrior: {
      enabled: true, maxShareOfPersonalScore: 0.35, confidenceThreshold: 20,
      halfLifeDays: 45, minWatchedSeconds: 300, minCompletion: 0.3,
    },
    historyMaxAgeDays: 180,
    maxGuestSessions: 200,
    maxGuestActions: 600,
    maxGuestMovieHistory: 200,
    // Different trailers from one film must not multiply its dimensional credit.
    maxPositivePerMovie: 2.5,
    affinityWeights: {
      genre: 1,
      country: 1,
      actor: 1.1,
      genreCountry: 1.8,
      genreActor: 1.8,
    },
    halfLifeDays: 30,
    maxAffinityPerValue: 10,
  },

  engagement: {
    impression: { minVisibleRatio: 0.5, minVisibleMs: 1000 },
    meaningfulWatch: { minCoverage: 0.25, minRealSeconds: 3 },
    completion: { minCoverage: 0.9 },
    rewatch: { minExtraCoverage: 0.1 },
    collection: { maxGuestEvents: 600, maxAgeDays: 30, accountRequestsPerMinute: 120 },
    // These affect trailer affinity only, never movie progress/affinity.
    weights: {
      impression: 0,
      open: 0.05,
      meaningfulWatch: 1,
      completion: 0.4,
      rewatch: 0.15,
      like: 0.8,
      dislike: -1,
      openMovie: 1,
      earlyExit: 0,
    },
    maxPositiveScorePerViewerTrailerDay: 2.5,
    maxRewatchBoostPerViewerTrailerDay: 0.15,
    // Skipping is not a negative genre/country/actor preference.
    propagateDislikeToMovieDimensions: false,
    deduplicateEvents: true,
  },

  trending: {
    windowDays: 7,
    halfLifeHours: 48,
    refreshIntervalMs: 15 * 60 * 1000,
    // Components must be normalized before combination; missing metrics are not invented.
    weights: { uniqueMeaningfulViewers: 0.25, coverage: 0.3, completion: 0.15, likes: 0.1, movieOpens: 0.2 },
    // Smooth rates toward the observed global prior, not a fixed fake success rate.
    priorSampleSize: 20,
    minDistinctViewers: 3,
    minMeaningfulViewers: 2,
    dislikePenalty: 0.25,
    maxContributionPerViewerTrailerDay: 1,
    includeGuestSignals: true,
    useLifetimeViewCountAsScore: false,
  },

  fresh: { maxAgeDays: 30, halfLifeDays: 7, allowUnrated: true },

  diversity: {
    windowSize: 10,
    maxPerChannelInWindow: 2,
    maxPerMovieInWindow: 1,
    maxPerGenreInWindow: 4,
    maxPerCountryInWindow: 5,
    maxPerActorInWindow: 3,
    avoidAdjacentSameChannel: true,
    // Relax only when necessary to fill the feed; preserve identity uniqueness.
    relaxationOrder: ['actor', 'country', 'genre', 'adjacentChannel', 'channel', 'movie'],
    deduplicateBy: ['movieId', 'trailerId'],
  },

  repetition: {
    completedCooldownHours: 72,
    impressionLookbackHours: 24,
    maxImpressionsPerViewerTrailer: 3,
    repeatedImpressionPenalty: 0.25,
    dislikedCooldownDays: 30,
  },

  history: {
    accountAndGuestUseSameRankingRules: true,
    mergeGuestIntoAccountAutomatically: false,
    writeTrailerSignalsToMovieHistory: false,
  },
};

const deepFreeze = (value) => {
  Object.values(value).forEach((child) => {
    if (child && typeof child === 'object') deepFreeze(child);
  });
  return Object.freeze(value);
};

deepFreeze(sourceTypes);
deepFreeze(trailerHomeFeedWeights);

module.exports = { sourceTypes, trailerHomeFeedWeights };
