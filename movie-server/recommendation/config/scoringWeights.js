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

  /**
   * WatchEvent append-log retention (Mongo TTL on watchedAt).
   * Affinity / UserReaction / progress alohida saqlanadi — TTL faqat event log’ni kesadi.
   * ttlDays >> trending.windowDays (default 180 ≫ 30).
   * null yoki 0 → TTL o‘chirilgan (faqat oddiy watchedAt index).
   */
  watchEvent: {
    ttlDays: 180,
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
  /** Umumiy soft cap (popular + affinity expand) */
  candidatePoolSize: 450,
  /** Popularity/recency bo‘yicha asosiy pool */
  candidatePoolPopular: 300,
  /** User top genre/country/actor bo‘yicha qo‘shimcha niche pool */
  candidatePoolAffinity: 150,
  affinitySeedGenres: 5,
  affinitySeedCountries: 3,
  affinitySeedActors: 8,

  /**
   * Confidence-based blending (personalized ↔ trending).
   * alpha = f(experienceCount); blended = alpha*personal + (1-alpha)*trending.
   * Per category — user one sectionda tajribali, boshqasida yangi bo‘lishi mumkin.
   */
  blend: {
    /** 'linear' | 'exponential' */
    strategy: 'linear',
    /** linear: alpha = min(1, count / confidenceThreshold) */
    confidenceThreshold: 20,
    /** exponential: alpha = 1 - exp(-count / confidenceK) */
    confidenceK: 10,
    /**
     * Sifatli tajriba: completionRate > qualityMinCompletion (DISTINCT film)
     * YOKI UserReaction movie like shu categoryda.
     * WatchEvent.liked production path’da yozilmaydi — like manbai UserReaction.
     */
    qualityMinCompletion: 0.3,
    /**
     * Blend oldidan personal/trending ni bir xil [0,1] scale’ga keltirish.
     * 'minmax' — candidate pool ichida (precompute); raw additive emas.
     * 'none' — eski xatti-harakat (faqat debug).
     */
    normalizeMode: 'minmax',
    /**
     * Bitta film (pool yo‘q) uchun personal soft-cap → [0,1].
     * Tipik personal score ~0–20 oralig‘i.
     */
    personalNormCap: 20,
  },

  /**
   * Category trending (barcha userlar, background precompute).
   * trendingScore = w1*norm(views) + w2*norm(avgDuration) + w3*norm(likes) + w4*completionAvg
   */
  trending: {
    /** watch_events oynasi (kun) */
    windowDays: 30,
    /** Soatlik job intervali (ms) — 1 soat */
    precomputeIntervalMs: 60 * 60 * 1000,
    /** Formula vaznlari (yig‘indi ~1) */
    wViews: 0.35,
    wAvgDuration: 0.25,
    wLikes: 0.25,
    wCompletion: 0.15,
    /**
     * Empty category / missing row: trendingScore = popularity (0..1).
     * Components (views/duration/likes/completion) stay honest zeros — no fake mapping.
     */
    usePopularityFallback: true,
    /**
     * Serve: cache.generatedAt < category trending.updatedAt → stale, qayta precompute.
     * To‘g‘ri yo‘l: lazy refresh (barcha user cache’ni soatlik o‘chirish — stampede).
     */
    invalidateUserCacheWhenNewer: true,
    /**
     * Qo‘shimcha absolute TTL (ms). null → precomputeIntervalMs * 2.
     * Trending yangilanmasa ham juda eski cache qayta hisoblansin.
     */
    userCacheMaxAgeMs: null,
    /** Multi-instance: trending job Mongo lock TTL */
    lockTtlMs: 45 * 60 * 1000,
  },

  /** Diversity re-ranking */
  diversity: {
    /** Max share of Top-N for one actor or one country (0..1) */
    maxSharePerActor: 0.4,
    maxSharePerCountry: 0.4,
    /**
     * Soft MMR-style penalty when repeating actor/country.
     * With penaltyScale='range': effective = repeatPenalty * (maxScore - minScore)
     * so ~0.35 stays meaningful on both blended [0,1] and raw ~5–300 scores.
     */
    repeatPenalty: 0.35,
    /**
     * 'range' — scale soft penalty by candidate pool score span (default)
     * 'absolute' — subtract repeatPenalty as-is (legacy; weak when scores >> penalty)
     */
    penaltyScale: 'range',
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
