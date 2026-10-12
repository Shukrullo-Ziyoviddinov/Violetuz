/**
 * Video, musiqa va albom detalidagi "tavsiya etilgan" vaznlari.
 *
 * Bitta algoritm, ikki tomon:
 * - klip va konsert sahifasi → faqat qo'shiq
 * - musiqa va albom sahifasi → faqat klip
 *
 * music-similar, music-home-feed, album-home-feed va
 * recommendation-music chaqirilmaydi. Shu faylga ulanmaydi.
 *
 * Katalog shu faylda: video sahifa — qo'shiq, musiqa va albom sahifa — klip.
 * Konsert klip qatoriga kirmaydi.
 *
 * Yig'ish shu faylda: bog'langan element birinchi, keyin ijrochi bloki.
 * 3-qadam va qisqa qator qadami o'z ichida aralashadi, bir-biriga qo'shilmaydi.
 *
 * @module detail-recommend/detailRecommend
 */

'use strict';

const mongoose = require('mongoose');
const Music = require('../models/Music.model');
const Clip = require('../models/Clip.model');
const Concert = require('../models/Concert.model');
const Album = require('../models/Album.model');
const ContentView = require('../models/ContentView.model');

/**
 * Barcha sonlar va qoidalar shu yerda.
 * Keyingi qadamlar shu obyektdan o'qiydi.
 */
const detailRecommendWeights = {
  /**
   * Sahifa → natija turi.
   * Konsert klip qatoriga kirmaydi.
   */
  rails: Object.freeze({
    music: Object.freeze({
      pageTypes: Object.freeze(['klip', 'konsert']),
      resultType: 'music',
    }),
    clips: Object.freeze({
      pageTypes: Object.freeze(['music', 'musicAlbom']),
      resultType: 'klip',
    }),
  }),

  /** Bog'langan element birinchi o'rinda qoladi. Tinglangan yoki ko'rilgan bo'lsa ham siljimaydi. */
  linkedStaysFirst: true,

  /** Shu ijrochidan, bog'langan elementdan tashqari, ko'pi bilan shuncha. Yangiroq yil yuqoriroq. */
  artistMax: 3,

  /**
   * 3-qadam ichida, va alohida qisqa qator qadami ichida, aktiv ijrochidan ko'pi bilan shuncha.
   * 2-qadam blokiga qo'shilmaydi.
   */
  activeArtistStepMax: 3,

  /** Shu qadam ichida aktiv ijrochi yonma-yon shunchadan oshmaydi. Boshqa ijrochi qolgan bo'lsa. */
  activeArtistRunMax: 2,

  /** 3-qadam: janr va til birga mos keladi. */
  matchGenreWithLanguage: true,

  /** Janr va til teng bo'lsa, mamlakat ustun. */
  countryTieBreak: true,

  /** Qator qisqa bo'lsa: shu janr, boshqa til. */
  allowOtherLanguageIfShort: true,

  /** Katalogning qolgani bilan to'ldirilmaydi. */
  fillRestOfCatalog: false,

  /** Yakuniy qator uzunligi. */
  resultLimit: 12,
};

const MUSIC_SELECT = Object.freeze({
  _id: 0,
  id: 1,
  title: 1,
  artistId: 1,
  genre: 1,
  language: 1,
  country: 1,
  year: 1,
  type: 1,
  clipId: 1,
  img: 1,
});

const CLIP_SELECT = Object.freeze({
  _id: 0,
  id: 1,
  title: 1,
  artistId: 1,
  genre: 1,
  language: 1,
  country: 1,
  year: 1,
  type: 1,
  musicId: 1,
  img: 1,
});

/**
 * Music kolleksiyasi qo'shiq. type bo'sh bo'lsa ham qo'shiq.
 * @returns {Object}
 */
const musicCatalogMatch = () => ({
  $or: [
    { type: 'music' },
    { type: { $exists: false } },
    { type: null },
    { type: '' },
  ],
});

/**
 * Faqat klip. Konsert bu ro'yxatda yo'q.
 * @returns {{ type: { $in: string[] } }}
 */
const clipCatalogMatch = () => ({
  type: { $in: ['klip', 'clip'] },
});

/**
 * Video sahifa (klip va konsert) natijasi. Faqat qo'shiq katalogi.
 * @returns {Promise<Object[]>}
 */
const listMusicCatalog = async () => {
  const rows = await Music.find(musicCatalogMatch())
    .select(MUSIC_SELECT)
    .lean();
  return rows || [];
};

/**
 * Musiqa va albom sahifa natijasi. Faqat klip katalogi.
 * @returns {Promise<Object[]>}
 */
const listClipCatalog = async () => {
  const rows = await Clip.find(clipCatalogMatch())
    .select(CLIP_SELECT)
    .lean();
  return rows || [];
};

/**
 * Natija turiga qarab katalog. music → qo'shiq, klip → klip.
 * Boshqa tur bo'sh ro'yxat.
 *
 * @param {string} resultType
 * @returns {Promise<Object[]>}
 */
const listCatalogForResult = async (resultType) => {
  const type = String(resultType || '').trim();
  if (type === detailRecommendWeights.rails.music.resultType) {
    return listMusicCatalog();
  }
  if (type === detailRecommendWeights.rails.clips.resultType) {
    return listClipCatalog();
  }
  return [];
};

/**
 * @param {string|import('mongoose').Types.ObjectId|null|undefined} value
 * @returns {import('mongoose').Types.ObjectId|null}
 */
const parseUserId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  const str = String(value).trim();
  if (!mongoose.Types.ObjectId.isValid(str)) return null;
  return new mongoose.Types.ObjectId(str);
};

/**
 * Natija turi → ContentView.type.
 * Qo'shiq: music. Klip: klip. Albom va konsert yo'q.
 *
 * @param {string} resultType
 * @returns {'music'|'klip'|null}
 */
const seenViewType = (resultType) => {
  const type = String(resultType || '').trim();
  if (type === detailRecommendWeights.rails.music.resultType) return 'music';
  if (type === detailRecommendWeights.rails.clips.resultType) return 'klip';
  return null;
};

/**
 * Mehmon qatori shu natija turiga tegishlimi.
 * Mehmon klipni `clip` deb saqlaydi. ContentView esa `klip`.
 * Albom va konsert mos kelmaydi.
 *
 * @param {string} resultType
 * @param {unknown} contentType
 * @returns {boolean}
 */
const guestMarkMatches = (resultType, contentType) => {
  const raw = String(contentType || '').trim().toLowerCase();
  const viewType = seenViewType(resultType);
  if (viewType === 'music') return raw === 'music';
  if (viewType === 'klip') return raw === 'klip' || raw === 'clip';
  return false;
};

/**
 * Login. ContentView dan faqat o'qish. Yozuv yo'q.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} resultType
 * @returns {Promise<Set<string>>}
 */
const listSeenIds = async (userId, resultType) => {
  const ids = new Set();
  const viewType = seenViewType(resultType);
  const uid = parseUserId(userId);
  if (!viewType || !uid) return ids;

  const rows = await ContentView.find({ userId: uid, type: viewType })
    .select({ itemId: 1, _id: 0 })
    .lean();

  for (const row of rows || []) {
    const itemId = String(row.itemId || '').trim();
    if (itemId) ids.add(itemId);
  }
  return ids;
};

/**
 * Mehmon tarixi. Faqat shu turdagi id lar. Albom va konsert tushadi.
 *
 * @param {unknown} localHistory
 * @param {string} resultType
 * @returns {Set<string>}
 */
const seenIdsFromGuestHistory = (localHistory, resultType) => {
  const ids = new Set();
  const rows = Array.isArray(localHistory) ? localHistory : [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const contentType = row.ct ?? row.contentType;
    if (!guestMarkMatches(resultType, contentType)) continue;
    const itemId = String(row.m ?? row.contentId ?? row.id ?? '').trim();
    if (itemId) ids.add(itemId);
  }
  return ids;
};

/**
 * @param {unknown} value
 * @returns {string}
 */
const asText = (value) => String(value ?? '').trim();

/**
 * @param {unknown} value
 * @returns {string}
 */
const asKey = (value) => asText(value).toLowerCase();

/**
 * Sahifa turi. Mehmon qisqartmalari shu yerdagi turlarga tushadi.
 *
 * @param {Object|null|undefined} page
 * @returns {string}
 */
const pageTypeOf = (page) => {
  const raw = asKey(page?.type || page?.pageType);
  if (raw === 'clip') return 'klip';
  if (raw === 'concert') return 'konsert';
  if (raw === 'album' || raw === 'music_album' || raw === 'musicalbom') return 'musicAlbom';
  return raw;
};

/**
 * Sahifa → natija turi. Noma'lum sahifa bo'sh.
 *
 * @param {Object|null|undefined} page
 * @returns {'music'|'klip'|null}
 */
const resultTypeForPage = (page) => {
  const pageType = pageTypeOf(page);
  if (detailRecommendWeights.rails.music.pageTypes.includes(pageType)) {
    return detailRecommendWeights.rails.music.resultType;
  }
  if (detailRecommendWeights.rails.clips.pageTypes.includes(pageType)) {
    return detailRecommendWeights.rails.clips.resultType;
  }
  return null;
};

/**
 * Bog'langan id lar, sahifa tartibida.
 * Klip va konsert: bitta musicId. Musiqa: bitta clipId.
 * Albom: qo'shiqlar ketma-ketligida clipIds. Albomning o'zida clipId yo'q.
 *
 * @param {Object|null|undefined} page
 * @param {'music'|'klip'} resultType
 * @returns {string[]}
 */
const linkedIdsForPage = (page, resultType) => {
  const pageType = pageTypeOf(page);
  if (resultType === 'music') {
    const id = asText(page?.musicId);
    return id ? [id] : [];
  }
  if (pageType === 'music') {
    const id = asText(page?.clipId);
    return id ? [id] : [];
  }
  if (pageType === 'musicAlbom') {
    const ids = [];
    const songs = Array.isArray(page?.songs) ? page.songs : [];
    for (const song of songs) {
      const clipIds = Array.isArray(song?.clipIds) ? song.clipIds : [];
      for (const clipId of clipIds) {
        const id = asText(clipId);
        if (id) ids.push(id);
      }
    }
    return ids;
  }
  return [];
};

/**
 * Natija katalogidagi qator. Konsert klip qatoriga kirmaydi.
 *
 * @param {Object} row
 * @param {'music'|'klip'} resultType
 * @returns {boolean}
 */
const rowFitsResult = (row, resultType) => {
  const type = asKey(row?.type);
  if (resultType === 'music') return type === 'music' || type === '';
  if (resultType === 'klip') return type === 'klip' || type === 'clip';
  return false;
};

/**
 * @param {Object} row
 * @returns {number|null}
 */
const yearOf = (row) => {
  const year = Number(row?.year);
  return Number.isFinite(year) ? year : null;
};

/**
 * Yangiroq yil yuqoriroq. Yil teng bo'lsa, sahifa mamlakati ustun.
 *
 * @param {Object} page
 * @returns {(a: Object, b: Object) => number}
 */
const compareNewerYear = (page) => (a, b) => {
  const ay = yearOf(a);
  const by = yearOf(b);
  if (ay == null && by != null) return 1;
  if (by == null && ay != null) return -1;
  if (ay != null && by != null && ay !== by) return by - ay;
  if (!detailRecommendWeights.countryTieBreak) return 0;
  const aCountry = asKey(a?.country) !== '' && asKey(a?.country) === asKey(page?.country);
  const bCountry = asKey(b?.country) !== '' && asKey(b?.country) === asKey(page?.country);
  if (aCountry === bCountry) return 0;
  return aCountry ? -1 : 1;
};

/**
 * @param {Set<string>|string[]|null|undefined} seenIds
 * @returns {Set<string>}
 */
const toSeenSet = (seenIds) => {
  if (seenIds instanceof Set) {
    const ids = new Set();
    for (const id of seenIds) {
      const itemId = asText(id);
      if (itemId) ids.add(itemId);
    }
    return ids;
  }
  const ids = new Set();
  const rows = Array.isArray(seenIds) ? seenIds : [];
  for (const id of rows) {
    const itemId = asText(id);
    if (itemId) ids.add(itemId);
  }
  return ids;
};

/**
 * @param {Object} row
 * @param {string} artistId
 * @returns {boolean}
 */
const isActiveArtist = (row, artistId) => Boolean(artistId) && asText(row?.artistId) === artistId;

/**
 * @param {Object[]} rows
 * @param {string} artistId
 * @returns {number}
 */
const trailingActiveRun = (rows, artistId) => {
  let run = 0;
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (!isActiveArtist(rows[index], artistId)) break;
    run += 1;
  }
  return run;
};

/**
 * Kuchliroq aktiv ijrochi qoladi. Limitdan oshgani tushadi.
 *
 * @param {Object[]} rows
 * @param {string} artistId
 * @param {number} max
 * @returns {Object[]}
 */
const capActiveArtist = (rows, artistId, max) => {
  if (!artistId || !Number.isFinite(max) || max < 0) return rows;
  let kept = 0;
  const out = [];
  for (const row of rows) {
    if (isActiveArtist(row, artistId)) {
      if (kept >= max) continue;
      kept += 1;
    }
    out.push(row);
  }
  return out;
};

/**
 * Aktiv ijrochi yonma-yon runMax tadan oshmaydi.
 * Boshqa ijrochi qolmagan bo'lsa, qolgani o'z joyida turadi.
 *
 * @param {Object[]} rows
 * @param {string} artistId
 * @param {number} runMax
 * @param {number} [initialRun]
 * @returns {Object[]}
 */
const spaceActiveArtist = (rows, artistId, runMax, initialRun = 0) => {
  if (!artistId || !Number.isFinite(runMax) || runMax <= 0) return rows.slice();
  const pending = rows.slice();
  const out = [];
  let run = initialRun > 0 ? initialRun : 0;
  while (pending.length) {
    const active = isActiveArtist(pending[0], artistId);
    if (!active || run < runMax) {
      out.push(pending.shift());
      run = active ? run + 1 : 0;
      continue;
    }
    const otherIndex = pending.findIndex((row) => !isActiveArtist(row, artistId));
    if (otherIndex === -1) {
      out.push(pending.shift());
      run += 1;
      continue;
    }
    out.push(pending.splice(otherIndex, 1)[0]);
    run = 0;
  }
  return out;
};

/**
 * Qadam ichida: eshitilmagan oldin, keyin aktiv ijrochi limiti va aralashish.
 *
 * @param {Object[]} rows
 * @param {string} artistId
 * @param {Set<string>} seen
 * @param {number} initialRun
 * @returns {Object[]}
 */
const mixInsideStep = (rows, artistId, seen, initialRun) => {
  const ordered = unseenFirst(rows, seen);
  const capped = capActiveArtist(ordered, artistId, detailRecommendWeights.activeArtistStepMax);
  return spaceActiveArtist(
    capped,
    artistId,
    detailRecommendWeights.activeArtistRunMax,
    initialRun
  );
};

/**
 * Hovuz ichida eshitilmagan yoki ko'rilmagan oldinda. O'zaro tartib saqlanadi.
 *
 * @param {Object[]} rows
 * @param {Set<string>} seen
 * @returns {Object[]}
 */
const unseenFirst = (rows, seen) => {
  const fresh = [];
  const opened = [];
  for (const row of rows) {
    if (seen.has(asText(row.id))) opened.push(row);
    else fresh.push(row);
  }
  return [...fresh, ...opened];
};

/**
 * Kelishilgan tartib. Boshqa algoritm chaqirilmaydi.
 *
 * @param {{ page?: Object, catalog?: Object[], seenIds?: Set<string>|string[]|null }} [input]
 * @returns {Object[]}
 */
const assembleDetailRecommend = ({ page, catalog, seenIds } = {}) => {
  const resultType = resultTypeForPage(page);
  const limit = detailRecommendWeights.resultLimit;
  if (!resultType || !Number.isFinite(limit) || limit <= 0) return [];

  const byId = new Map();
  const rows = Array.isArray(catalog) ? catalog : [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    if (!rowFitsResult(row, resultType)) continue;
    const id = asText(row.id);
    if (!id || byId.has(id)) continue;
    byId.set(id, row);
  }

  const used = new Set();
  const linked = [];
  for (const id of linkedIdsForPage(page, resultType)) {
    if (used.has(id)) continue;
    const row = byId.get(id);
    if (!row) continue;
    used.add(id);
    linked.push(row);
  }

  const artistPool = [];
  const artistId = asText(page?.artistId);
  if (artistId) {
    for (const row of byId.values()) {
      const id = asText(row.id);
      if (used.has(id)) continue;
      if (asText(row.artistId) !== artistId) continue;
      artistPool.push(row);
    }
    artistPool.sort(compareNewerYear(page));
  }
  const artistMax = detailRecommendWeights.artistMax;
  const artistPicks = artistPool.slice(0, artistMax > 0 ? artistMax : 0);
  for (const row of artistPicks) used.add(asText(row.id));

  const genrePool = [];
  const pageGenre = asKey(page?.genre);
  const pageLanguage = asKey(page?.language);
  if (detailRecommendWeights.matchGenreWithLanguage && pageGenre && pageLanguage) {
    for (const row of byId.values()) {
      const id = asText(row.id);
      if (used.has(id)) continue;
      if (asKey(row.genre) !== pageGenre || asKey(row.language) !== pageLanguage) continue;
      genrePool.push(row);
    }
    genrePool.sort(compareNewerYear(page));
  }

  const seen = toSeenSet(seenIds);
  const artistOrdered = unseenFirst(artistPicks, seen);
  const head = detailRecommendWeights.linkedStaysFirst
    ? [...linked, ...artistOrdered]
    : unseenFirst([...linked, ...artistOrdered], seen);
  const genreOrdered = mixInsideStep(
    genrePool,
    artistId,
    seen,
    trailingActiveRun(head, artistId)
  );
  const ordered = [...head, ...genreOrdered];

  const result = ordered.slice(0, limit);
  if (!detailRecommendWeights.allowOtherLanguageIfShort || result.length >= limit) {
    return result;
  }
  if (!pageGenre || !pageLanguage) return result;

  const picked = new Set(result.map((row) => asText(row.id)));
  const otherLanguage = [];
  for (const row of byId.values()) {
    const id = asText(row.id);
    if (picked.has(id)) continue;
    const language = asKey(row.language);
    if (!language || language === pageLanguage) continue;
    if (asKey(row.genre) !== pageGenre) continue;
    otherLanguage.push(row);
  }
  otherLanguage.sort(compareNewerYear(page));
  const otherOrdered = mixInsideStep(
    otherLanguage,
    artistId,
    seen,
    trailingActiveRun(result, artistId)
  );

  const filled = result.slice();
  for (const row of otherOrdered) {
    if (filled.length >= limit) break;
    filled.push(row);
  }
  return filled;
};

const PAGE_SELECT = Object.freeze({
  _id: 0,
  id: 1,
  type: 1,
  artistId: 1,
  genre: 1,
  language: 1,
  country: 1,
  year: 1,
  musicId: 1,
  clipId: 1,
  'songs.clipIds': 1,
});

/**
 * Joriy sahifa. Klip, konsert, musiqa yoki albom. Yozuv yo'q.
 *
 * @param {unknown} pageType
 * @param {unknown} pageId
 * @returns {Promise<Object|null>}
 */
const findDetailPage = async (pageType, pageId) => {
  const type = pageTypeOf({ type: pageType });
  const id = Number(asText(pageId));
  if (!Number.isInteger(id)) return null;

  const modelByType = {
    klip: Clip,
    konsert: Concert,
    music: Music,
    musicAlbom: Album,
  };
  const Model = modelByType[type];
  if (!Model) return null;

  const page = await Model.findOne({ id }).select(PAGE_SELECT).lean();
  if (!page) return null;
  if (!asText(page.type)) page.type = type;
  return page;
};

/**
 * Route shu funksiyani chaqiradi. Boshqa algoritm yo'q.
 * Login: ContentView. Mehmon: localHistory. Bazaga yozilmaydi.
 *
 * @param {{ pageType?: unknown, pageId?: unknown, userId?: unknown, localHistory?: unknown }} [input]
 * @returns {Promise<{ resultType: 'music'|'klip', items: Object[] }|null>}
 */
const buildDetailRecommend = async ({ pageType, pageId, userId, localHistory } = {}) => {
  const page = await findDetailPage(pageType, pageId);
  if (!page) return null;

  const resultType = resultTypeForPage(page);
  if (!resultType) return null;

  const catalog = await listCatalogForResult(resultType);
  const seenIds = userId
    ? await listSeenIds(userId, resultType)
    : seenIdsFromGuestHistory(localHistory, resultType);
  const items = assembleDetailRecommend({ page, catalog, seenIds });
  return { resultType, items };
};

module.exports = {
  detailRecommendWeights,
  musicCatalogMatch,
  clipCatalogMatch,
  listMusicCatalog,
  listClipCatalog,
  listCatalogForResult,
  seenViewType,
  guestMarkMatches,
  listSeenIds,
  seenIdsFromGuestHistory,
  assembleDetailRecommend,
  buildDetailRecommend,
};
