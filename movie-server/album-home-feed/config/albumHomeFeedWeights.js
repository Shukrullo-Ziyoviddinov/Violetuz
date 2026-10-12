/**
 * "Siz uchun albomlar" vaznlari.
 * music-home-feed, kino home-feed va recommendation-music/config/scoringWeights.js ga yozilmaydi.
 *
 * Tinglandi eshigi va listenedPenalty keyingi qadamlarda recommendation-music dan
 * faqat o'qiladi. Shu faylda ikkinchi formula yo'q.
 *
 * @module album-home-feed/config/albumHomeFeedWeights
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
const albumHomeFeedWeights = {
  sourceTypes,

  /** Faqat albom. Musiqa, klip, konsert lentaga kirmaydi. */
  contentType: 'album',

  excludedContentTypes: ['music', 'clip', 'concert'],

  /** Yakuniy lenta uzunligi. */
  feedSize: 40,

  /**
   * Har bir manbadan olinadigan nomzod chegarasi.
   * Keyin takror contentId tashlanadi.
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
   */
  rankWeights: {
    personal: 1,
    collaborative: 0.55,
    trending: 0.45,
    fresh: 0.35,
    exploration: 0.2,
  },

  /**
   * Har 5 o'rin: 3 shaxsiy, 1 trend, 1 yangi yoki exploration.
   * Juftlik manbasi bo'sh bo'lsa uning o'rni shaxsiyga qo'shilmaydi.
   */
  slotMix: {
    window: 5,
    personal: 3,
    trending: 1,
    freshOrExploration: 1,
  },

  /** Butun albom lentasi bo'yicha diversity. */
  diversity: {
    maxPerCategory: 5,
    maxPerArtist: 2,
    /** Iloji bo'lsa ketma-ket ikkita bir xil categoryNameMusic turmasin. */
    avoidAdjacentSameCategory: true,
    /**
     * Nomzodlarning yarmidan ko'pida turgan ijrochi signal emas.
     * U maxPerArtist ga kirmaydi.
     */
    ignoreArtistAboveShare: 0.5,
  },

  /**
   * Yangi albom. Katalogda createdAt va sayt rating yo'q, yil bor.
   * Manba keyingi qadamda shu oynani qo'llaydi.
   */
  fresh: {
    maxAgeYears: 1,
  },

  /** Hali tinglamagan janr. Manba ichida, lenta diversity dan oldin. */
  exploration: {
    maxPerCategory: 2,
  },

  /** Birga eshitilgan albom juftligi. Kamida shu marta birga eshitilganlar saqlanadi. */
  coOccurrence: {
    minCount: 3,
    /** Foydalanuvchining so'nggi nechta eshitgan albomidan juftlik olinadi. */
    recentSeedAlbums: 5,
    /** Bir odamdan juftlikka kiradigan eshitilgan albomlar chegarasi. */
    maxAlbumsPerUser: 40,
    precomputeIntervalMs: 24 * 60 * 60 * 1000,
  },

  /** Login cache yangilanish oralig'i (ms). Job keyingi qadamda. */
  precomputeIntervalMs: 4 * 60 * 60 * 1000,
};

module.exports = {
  sourceTypes,
  albumHomeFeedWeights,
};
