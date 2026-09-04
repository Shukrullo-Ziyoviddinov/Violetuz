/**
 * Recommendation scoring weights & engine knobs.
 * All numeric knobs live here — never hardcode in services/jobs.
 *
 * Priority (approx): combo > actor ≈ genre ≈ country > popularity/recency.
 * No single weight may dominate (prevents "only one actor" filter effect).
 */

'use strict';

/** @type {import('../types/recommendation.types').ScoringWeightsConfig} */
const scoringWeights = {
  /** Single-dimension affinity */
  genre: 1.0,
  country: 1.0,
  actor: 1.1,

  /** Combo affinity (strongest personalized signal) */
  comboGenreCountry: 1.8,
  comboGenreActor: 1.8,

  /** Global / cold-start signals */
  popularity: 0.35,
  rating: 0.25,
  recency: 0.2,

  /** Penalties */
  watchedPenalty: 2.5,
  duplicateWatchCap: 1.0,

  /**
   * Watch progress (user × movie — bitta yozuv, max upsert).
   * Minimal 5 daqiqa → "ko'rildi"; keyin eng yuqori completion saqlanadi.
   */
  progress: {
    minWatchedSeconds: 300,
    shortFilmCompleteRatio: 0.8,
    /** Affinity qayta kuchayishi uchun minimal completion o'sishi */
    affinityMinDelta: 0.1,
  },

  /** Affinity decay (all dimension types) */
  decay: {
    /** Half-life in days — score halves after this many days without reinforcement */
    halfLifeDays: 45,
    /** Floor so old interests never fully disappear */
    minScore: 0.05,
    /** Cap after update so scores cannot explode */
    maxScore: 10,
    /** Base boost per watch event (before completion/like modifiers) */
    watchBoost: 1.0,
    /** Extra boost when liked */
    likedBoost: 0.35,
    /** Multiplier from completion_rate (0..1) */
    completionWeight: 0.5,
  },

  /** Precompute / serve */
  topN: 120,
  candidatePoolSize: 400,

  /** Diversity re-ranking */
  diversity: {
    /** Max share of Top-N for one actor or one country (0..1) */
    maxSharePerActor: 0.4,
    maxSharePerCountry: 0.4,
    /** Soft MMR-style penalty when repeating actor/country */
    repeatPenalty: 0.35,
    /** Hard: same actor/country may not appear more than twice in any window of this size */
    windowSize: 5,
    maxRepeatsInWindow: 2,
  },

  /** Movie field mapping (source of truth for extractors) */
  movieFields: {
    category: 'categoryName',
    genres: 'filterGenre',
    country: 'filterCountry',
    actors: 'actors',
  },

  /** Dimension type ids stored in user_affinity.dimension_type */
  dimensionTypes: {
    genre: 'genre',
    country: 'country',
    actor: 'actor',
    genreCountry: 'genre_country',
    genreActor: 'genre_actor',
  },

  /** Combo value separator, e.g. "Hindiston::jangari" */
  comboSeparator: '::',
};

module.exports = {
  scoringWeights,
};
