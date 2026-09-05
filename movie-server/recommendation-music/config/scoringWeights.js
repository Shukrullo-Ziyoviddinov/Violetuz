/**
 * Music recommendation scoring weights & engine knobs.
 * Isolated from movie recommendation — never share collections or movie fields.
 *
 * Dimensions: genre / country / language / artistId (+ combos).
 * Listen gate: ≥10s → "tinglandi". Likes: clip/concert only.
 *
 * @module recommendation-music/config/scoringWeights
 */

'use strict';

/** @type {import('../types/musicRecommendation.types').MusicScoringWeightsConfig} */
const scoringWeights = {
  /** Single-dimension affinity */
  genre: 1.0,
  country: 1.0,
  language: 0.9,
  artist: 1.2,

  /** Combo affinity */
  comboGenreCountry: 1.7,
  comboGenreArtist: 1.8,
  comboLanguageCountry: 1.5,

  /** Global / cold-start */
  popularity: 0.35,
  rating: 0.15,
  recency: 0.25,

  /** Penalties */
  listenedPenalty: 2.5,
  duplicateListenCap: 1.0,

  /**
   * Listen progress (user × contentKey).
   *
   * Gate: minListenedSeconds (10) → "tinglandi" / ContentView.
   * Strength: completionRate 0..1 → affinity listenBoost
   *   (decay.listenBoost * (1 + completionWeight * completion)).
   *
   * Storage:
   *   music|clip|concert — MAX(listenedSeconds, completionRate)
   *   album — sum(per-track MAX) / albumDurationSec
   */
  progress: {
    minListenedSeconds: 10,
    shortCompleteRatio: 0.8,
    /** Affinity qayta yozish uchun minimal completion o‘sishi */
    affinityMinDelta: 0.1,
  },

  listenEvent: {
    ttlDays: 180,
  },

  decay: {
    halfLifeDays: 45,
    minScore: 0.05,
    maxScore: 10,
    /** Base boost per listen event (completion=0) */
    listenBoost: 1.0,
    /** Extra boost when liked (clip/concert only) */
    likedBoost: 0.35,
    /**
     * Completion kuchaytirgich: 60%→+0.3, 100%→+0.5 (listenBoost ga nisbatan).
     * 10s “ko‘rildi” dan ustun — chuqur tinglash genre/country/language ni kuchaytiradi.
     */
    completionWeight: 0.5,
  },

  /**
   * Like affinity: faqat clip + concert.
   * music / album — like yo‘q (hook o‘chirilgan).
   */
  likeEnabledTypes: Object.freeze(['clip', 'concert']),

  topN: 120,
  candidatePoolSize: 450,
  candidatePoolPopular: 300,
  candidatePoolAffinity: 150,
  affinitySeedGenres: 5,
  affinitySeedCountries: 3,
  affinitySeedLanguages: 3,
  affinitySeedArtists: 8,

  /**
   * Absolute cache TTL (ms). Trending/blend music uchun ixtiyoriy keyin —
   * v1 da faqat max-age stale (lazy refresh).
   */
  cache: {
    userCacheMaxAgeMs: 2 * 60 * 60 * 1000,
  },

  diversity: {
    maxSharePerArtist: 0.4,
    maxSharePerCountry: 0.4,
    repeatPenalty: 0.35,
    penaltyScale: 'range',
    windowSize: 5,
    maxRepeatsInWindow: 2,
  },

  /** Content field mapping */
  contentFields: {
    category: 'categoryNameMusic',
    genre: 'genre',
    country: 'country',
    language: 'language',
    artistId: 'artistId',
  },

  contentTypes: Object.freeze(['music', 'album', 'clip', 'concert']),

  /** ContentView.type mapping */
  contentViewTypeByContentType: Object.freeze({
    music: 'music',
    album: 'album',
    clip: 'klip',
    concert: 'konsert',
  }),

  /** Reaction.type → contentType (like hooks) */
  reactionTypeToContentType: Object.freeze({
    klip: 'clip',
    konsert: 'concert',
  }),

  dimensionTypes: {
    genre: 'genre',
    country: 'country',
    language: 'language',
    artist: 'artist',
    genreCountry: 'genre_country',
    genreArtist: 'genre_artist',
    languageCountry: 'language_country',
  },

  comboSeparator: '::',
};

module.exports = {
  scoringWeights,
};
