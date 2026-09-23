/**
 * "Siz uchun" vaznlari.
 * Bo'lim algoritmining scoringWeights.js fayliga yozilmaydi.
 *
 * @module home-feed/config/homeFeedWeights
 */

'use strict';

/** @type {readonly ['personal', 'collaborative', 'trending', 'fresh', 'exploration']} */
const sourceTypes = Object.freeze([
  'personal',
  'collaborative',
  'trending',
  'fresh',
  'exploration',
]);

/**
 * Barcha sonlar shu yerda. Keyingi qadamlar shu configdan o'qiydi.
 */
const homeFeedWeights = {
  sourceTypes,

  /**
   * O'qishdan tushadi.
   * anonslar — treyler. movies — olib tashlangan eski bo'lim (trend jadvalida qoldiq).
   */
  excludedCategories: ['anonslar', 'movies'],

  /** Yakuniy lenta uzunligi. */
  feedSize: 40,

  /**
   * Har bir manbadan olinadigan nomzod chegarasi.
   * Keyin takror movieId tashlanadi.
   */
  candidateLimits: {
    personalPerCategory: 24,
    /** Trend bali bo'lim ichida normallanadi, shuning uchun har bo'limdan alohida o'qiladi. */
    trendingPerCategory: 12,
    collaborative: 40,
    trending: 40,
    fresh: 24,
    exploration: 24,
  },

  /**
   * Ranking vaznlari. Qo'shishdan oldin har bir manba ichida 0..1 ga normallanadi.
   * personal og'irligi keyinroq foydalanuvchi tajribasi (alpha) bilan pasayadi.
   */
  rankWeights: {
    personal: 1,
    collaborative: 0.55,
    trending: 0.45,
    fresh: 0.35,
    exploration: 0.2,
  },

  /** Allaqachon yetarli ko'rilgan kinodan ayiriladigan ball. */
  watchedPenalty: 2.5,

  /**
   * Har 5 o'rin: 3 shaxsiy, 1 trend, 1 yangi yoki exploration.
   * Juftlik manbasi bo'sh bo'lsa uning o'rni shaxsiyga qo'shilmaydi —
   * mixer keyingi qadamda shu nisbatni qo'llaydi.
   */
  slotMix: {
    window: 5,
    personal: 3,
    trending: 1,
    freshOrExploration: 1,
  },

  /** Butun lenta bo'yicha diversity. Bo'lim-ichi diversity.service.js ga tegilmaydi. */
  diversity: {
    maxPerCategory: 5,
    maxPerActor: 2,
    /** Iloji bo'lsa ketma-ket ikkita bir xil categoryName turmasin. */
    avoidAdjacentSameCategory: true,
    /**
     * Nomzodlarning yarmidan ko'pida turgan aktyor signal emas
     * (seed dagi umumiy id kabi). U maxPerActor ga kirmaydi.
     */
    ignoreActorAboveShare: 0.5,
  },

  /**
   * Yangi kino: createdAt oynasi + sayt `rating` (taxminan 4.4–5).
   * 4 qo'yilsa katalogdagi hammasi o'tadi.
   */
  fresh: {
    maxAgeDays: 45,
    minRating: 4.7,
    /** Bahosi yo'q, lekin oynadagi yangi kino ham nomzod bo'la oladi. */
    allowUnrated: true,
  },

  /** Hali ko'rilmagan janr. Manba ichida, lenta diversity dan oldin. */
  exploration: {
    minRating: 4.7,
    maxPerCategory: 2,
  },

  /** Birga ko'rilgan juftlik. Kamida shu marta birga ko'rilganlar saqlanadi. */
  coOccurrence: {
    minCount: 3,
    /** Foydalanuvchining so'nggi nechta ko'rgan kinosidan juftlik olinadi. */
    recentSeedMovies: 5,
    /** Bir odamdan juftlikka kiradigan ko'rilgan kinolar chegarasi. */
    maxMoviesPerUser: 40,
    precomputeIntervalMs: 24 * 60 * 60 * 1000,
  },

  /** Login cache yangilanish oralig'i (ms). Job keyingi qadamda. */
  precomputeIntervalMs: 4 * 60 * 60 * 1000,
};

module.exports = {
  sourceTypes,
  homeFeedWeights,
};
