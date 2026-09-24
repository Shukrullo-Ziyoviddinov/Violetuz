/**
 * "Sizga mos musiqalar" vaznlari.
 * Kino home-feed va recommendation-music/config/scoringWeights.js ga yozilmaydi.
 *
 * Tinglandi eshigi (10 soniya yoki qisqa trekda 80 foiz) va listenedPenalty
 * keyingi qadamlarda recommendation-music dan faqat o'qiladi. Shu faylda
 * ikkinchi formula yo'q.
 *
 * @module music-home-feed/config/musicHomeFeedWeights
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
const musicHomeFeedWeights = {
  sourceTypes,

  /** Faqat qo'shiq. Albom, klip, konsert lentaga kirmaydi. */
  contentType: 'music',

  excludedContentTypes: ['album', 'clip', 'concert'],

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

  /** Butun lenta bo'yicha diversity. Bo'lim-ichi musiqa diversity.service.js ga tegilmaydi. */
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
   * Yangi qo'shiq. Katalogda createdAt va sayt rating yo'q, yil bor.
   * Manba keyingi qadamda shu oynani qo'llaydi.
   */
  fresh: {
    maxAgeYears: 1,
  },

  /** Hali tinglamagan janr. Manba ichida, lenta diversity dan oldin. */
  exploration: {
    maxPerCategory: 2,
  },

  /** Birga eshitilgan juftlik. Kamida shu marta birga eshitilganlar saqlanadi. */
  coOccurrence: {
    minCount: 3,
    /** Foydalanuvchining so'nggi nechta eshitgan qo'shig'idan juftlik olinadi. */
    recentSeedTracks: 5,
    /** Bir odamdan juftlikka kiradigan eshitilgan qo'shiqlar chegarasi. */
    maxTracksPerUser: 40,
    precomputeIntervalMs: 24 * 60 * 60 * 1000,
  },

  /** Login cache yangilanish oralig'i (ms). Job keyingi qadamda. */
  precomputeIntervalMs: 4 * 60 * 60 * 1000,
};

module.exports = {
  sourceTypes,
  musicHomeFeedWeights,
};
