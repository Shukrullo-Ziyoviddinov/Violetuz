'use strict';

const { deepFreeze } = require('../utils/freeze');

/**
 * Every tunable used by shorts-reco. Scoring and feed phases read this object;
 * they must not introduce their own numeric literals for these rules.
 */
const config = deepFreeze({
  debug: process.env.SHORTS_RECO_DEBUG === '1',
  /** Mounted under the existing /api and /api/v1 prefixes. */
  mountPath: '/shorts-reco',
  contentTypes: ['music', 'klip', 'konsert'],

  catalogSyncBatchSize: 200,
  catalogLookupBatchSize: 500,
  catalogSyncIntervalMinutes: 15,
  /** Titles exist on music, clips and concerts, so artist-only grouping stays off. */
  songLinkArtistOnly: false,
  songLinkMethods: {
    catalogRef: 'catalogRef',
    artistTitle: 'artistTitle',
    artistOnly: 'artistOnly',
  },

  quickFlickMs: 1500,
  completionPassRatio: 0.9,
  maxCompletions: 5,
  rewatchScore: { 1: 1.5, 2: 3.5, 3: 4.5, 4: 5, 5: 5.5 },
  passRatioScore: [
    { below: 0.15, score: -1 },
    { below: 0.4, score: 0 },
    { below: 0.7, score: 0.5 },
    { below: 0.9, score: 1 },
  ],
  likeBonus: 2,
  likeBonusLowWatch: 1,
  lowWatchPassRatio: 0.3,
  commentBonus: 3,
  shareBonus: 3,
  scoreMax: 10,
  scoreMin: -1,
  skipPenaltyFactor: 0.5,
  typeCategoryWeight: 0.5,
  shares: {
    movieShorts: {
      movie: 1,
      musicKey: 0.8,
      type: 0.7,
      artist: 0.6,
      movieGenre: 0.5,
      country: 0.3,
      musicGenre: 0.3,
      musicCountry: 0.3,
    },
    musicshorts: {
      artist: 1,
      musicKey: 0.8,
      type: 0.7,
      musicGenre: 0.5,
      country: 0.3,
      linkedMovie: 0.4,
    },
  },
  franchiseShareOfMovie: 0.5,

  movieContributionCap: 5,
  qualifyThreshold: 1,
  actorConfirmMinMovies: 2,
  actorSkipPenaltyFactor: 0.5,
  /** Section 8: actor evidence is computed from the user's top qualifying movies. */
  topQualifyingMoviesLimit: 20,
  actorSlotsByLevel: { weak: 0, medium: 0, strong: 1, veryStrong: 2 },

  sessionWindow: 12,
  dailyDecay: 0.03,
  sessionAffinityWeight: 0.6,
  longTermAffinityWeight: 0.4,
  positionDecay: 0.85,
  affinityNormHalf: 5,
  freshnessDays: 7,
  /** Magnitudes are not fixed by the rules; these are the capped defaults. */
  freshnessBonusMax: 0.15,
  popularityBonusMax: 0.15,
  popularityLogDivisor: 20,
  profilePruneAbs: 0.0001,
  actorCacheTtlMs: 60000,

  maxActiveAnchors: 3,
  anchorMinStrength: 1,
  shiftItemCount: 3,
  shiftMinScore: 1,
  fatigueServedCount: 10,
  fatigueSameAnchorCount: 4,
  fatigueMeanPassRatio: 0.7,
  /** The rule is to halve a multiplier once. Repeated feed calls must not halve again. */
  anchorHalveFactor: 0.5,
  maxSameMoviePer10: 3,
  maxSameArtistPer10: 3,
  maxConsecutiveSameMovie: 2,

  repeatAfterDays: 7,
  maxRepeatsPer10: 2,
  feedBatchSize: 20,
  /** Movie and music page cards. One block is one horizontal row. */
  shelfBlockSize: 10,
  shelfReadLimit: 200,
  slotsPerCycle: 10,
  frozenAhead: 3,
  coldStartMinViews: 3,
  /** With 1–2 views, every Nth cold-start item is a profile pick. */
  coldStartProfileEvery: 3,
  exploreShare: 0.15,
  candidateFetchLimit: 40,
  similarFetchLimit: 80,
  watchStateReadLimit: 400,
  eventsTtlDays: 7,
  feedSessionTtlDays: 2,

  /**
   * Counts per 10 slots. anchor is [a, b, c].
   * Actor slots are taken from `similar`, not added on top.
   */
  levels: [
    { name: 'weak', minStrength: 0, anchor: [1, 0, 0], similar: 2, bridge: 0, rest: 7 },
    { name: 'medium', minStrength: 2, anchor: [2, 1, 0], similar: 2, bridge: 1, rest: 4 },
    { name: 'strong', minStrength: 5, anchor: [2, 1, 1], similar: 2, bridge: 1, rest: 3 },
    { name: 'veryStrong', minStrength: 8, anchor: [3, 1, 1], similar: 3, bridge: 1, rest: 1 },
  ],
});

module.exports = config;
