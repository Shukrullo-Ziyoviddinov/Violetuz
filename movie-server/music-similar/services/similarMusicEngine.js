/**
 * UCH QATLAMLI music/klip/album "shunga o'xshash" yig'ish.
 *
 * Q1 franchise (max q1Max, kesiladi) → Q2 artist+genre (max q2Max) →
 * Q3 soft skor → interleave assemble (Q1 tepada, keyin Q2/Q3 aralash).
 *
 * Title matcher YO'Q. movie-similar / recommendation ga ulanmaydi.
 *
 * @module music-similar/services/similarMusicEngine
 */

'use strict';

const { similarityWeights } = require('../config/similarityWeights');
const { normalizeContentType, toCatalogId } = require('../repositories/catalog.read');

const LAYERS = similarityWeights.layers;

/**
 * @param {unknown} item
 * @returns {number|null}
 */
const itemIdOf = (item) => toCatalogId(item?.id);

/**
 * @param {unknown} item
 * @returns {string}
 */
const artistIdOf = (item) =>
  String(item?.artistId || '')
    .trim()
    .toLowerCase();

/**
 * @param {unknown} item
 * @returns {string}
 */
const genreOf = (item) =>
  String(item?.genre || '')
    .trim()
    .toLowerCase();

/**
 * @param {unknown} item
 * @returns {string}
 */
const countryOf = (item) =>
  String(item?.country || '')
    .trim()
    .toLowerCase();

/**
 * @param {unknown} item
 * @returns {string}
 */
const languageOf = (item) =>
  String(item?.language || '')
    .trim()
    .toLowerCase();

/**
 * @param {unknown} item
 * @returns {number|null}
 */
const yearOf = (item) => {
  const y = Number(item?.year);
  return Number.isFinite(y) ? y : null;
};

/**
 * @param {number|null} yearA
 * @param {number|null} yearB
 * @returns {number}
 */
const getYearProximityScore = (yearA, yearB) => {
  if (yearA == null || yearB == null) return 0;
  const diff = Math.abs(yearA - yearB);
  if (diff === 0) return 1;
  if (diff <= 3) return 0.7;
  if (diff <= 10) return 0.4;
  return 0.1;
};

/**
 * QATLAM 3 soft formula.
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
const computeGeneralSimilarity = (a, b) => {
  const w = similarityWeights.general;
  const genreA = genreOf(a);
  const genreB = genreOf(b);
  const artistA = artistIdOf(a);
  const artistB = artistIdOf(b);
  const countryA = countryOf(a);
  const countryB = countryOf(b);
  const langA = languageOf(a);
  const langB = languageOf(b);

  const genreMatch = genreA && genreB && genreA === genreB ? 1 : 0;
  const artistMatch = artistA && artistB && artistA === artistB ? 1 : 0;
  const countryMatch = countryA && countryB && countryA === countryB ? 1 : 0;
  const languageMatch = langA && langB && langA === langB ? 1 : 0;
  const yearProximity = getYearProximityScore(yearOf(a), yearOf(b));

  return (
    w.w1Genre * genreMatch +
    w.w2Artist * artistMatch +
    w.w3Year * yearProximity +
    w.w4Country * countryMatch +
    w.w5Language * languageMatch
  );
};

/**
 * @param {object} item
 * @param {string} layer
 * @param {number} score
 * @returns {{ id: number, item: object, layer: string, score: number }}
 */
const toResultRow = (item, layer, score) => ({
  id: itemIdOf(item),
  item,
  layer,
  score: Number(score) || 0,
});

/**
 * QATLAM 1 — franshiza array tartibi, q1Max bilan kesiladi.
 * @param {Map<number, object>} byId
 * @param {unknown[]} ids
 * @param {Set<number>} usedIds
 * @param {number} maxCount
 * @returns {object[]}
 */
const resolveFranchiseLayer = (byId, ids, usedIds, maxCount) => {
  const ordered = Array.isArray(ids) ? ids : [];
  const cap = Math.max(0, Number(maxCount) || 0);
  /** @type {object[]} */
  const rows = [];

  for (const rawId of ordered) {
    if (rows.length >= cap) break;
    const id = toCatalogId(rawId);
    if (id == null || usedIds.has(id)) continue;
    const item = byId.get(id);
    if (!item) continue;
    usedIds.add(id);
    rows.push(toResultRow(item, LAYERS.franchise, 0));
  }

  return rows;
};

/**
 * QATLAM 2 — hard artistId + genre, max q2Max.
 * @param {object} current
 * @param {object[]} pool
 * @param {Set<number>} usedIds
 * @param {number} maxCount
 * @returns {object[]}
 */
const resolveArtistGenreLayer = (current, pool, usedIds, maxCount) => {
  const artist = artistIdOf(current);
  const genre = genreOf(current);
  const cap = Math.max(0, Number(maxCount) || 0);
  if (!artist || !genre || cap <= 0) return [];

  /** @type {Array<{ item: object, year: number }>} */
  const matched = [];
  for (const candidate of pool) {
    const id = itemIdOf(candidate);
    if (id == null || usedIds.has(id)) continue;
    if (artistIdOf(candidate) !== artist) continue;
    if (genreOf(candidate) !== genre) continue;
    matched.push({
      item: candidate,
      year: yearOf(candidate) ?? Number.MAX_SAFE_INTEGER,
    });
  }

  matched.sort(
    (a, b) => a.year - b.year || itemIdOf(a.item) - itemIdOf(b.item)
  );

  /** @type {object[]} */
  const rows = [];
  for (const entry of matched.slice(0, cap)) {
    const id = itemIdOf(entry.item);
    usedIds.add(id);
    rows.push(toResultRow(entry.item, LAYERS.artistGenre, 0));
  }
  return rows;
};

/**
 * QATLAM 3 — soft skor, score DESC.
 * @param {object} current
 * @param {object[]} pool
 * @param {Set<number>} usedIds
 * @param {number} maxCount
 * @returns {object[]}
 */
const resolveGeneralLayer = (current, pool, usedIds, maxCount) => {
  const cap = Math.max(0, Number(maxCount) || 0);
  if (cap <= 0) return [];

  /** @type {Array<{ item: object, score: number }>} */
  const scored = [];
  for (const candidate of pool) {
    const id = itemIdOf(candidate);
    if (id == null || usedIds.has(id)) continue;
    const score = computeGeneralSimilarity(current, candidate);
    if (!(score > 0)) continue;
    scored.push({ item: candidate, score });
  }

  scored.sort(
    (a, b) => b.score - a.score || itemIdOf(a.item) - itemIdOf(b.item)
  );

  /** @type {object[]} */
  const rows = [];
  for (const entry of scored.slice(0, cap)) {
    const id = itemIdOf(entry.item);
    usedIds.add(id);
    rows.push(toResultRow(entry.item, LAYERS.general, entry.score));
  }
  return rows;
};

/**
 * Q2 + Q3 ni aralashtirish: goh 1 Q2, goh 1–3 Q3.
 * Pattern: Q2, Q3, Q3, Q2, Q3, Q3, Q3, Q2, …
 *
 * @param {object[]} layer2
 * @param {object[]} layer3
 * @param {number} slots
 * @returns {object[]}
 */
const interleaveArtistGenreAndGeneral = (layer2, layer3, slots) => {
  const maxSlots = Math.max(0, Number(slots) || 0);
  /** @type {object[]} */
  const out = [];
  let i2 = 0;
  let i3 = 0;
  /** Q3 burst sizes: 2, 3, 2, 3… */
  let burstToggle = false;

  while (out.length < maxSlots && (i2 < layer2.length || i3 < layer3.length)) {
    if (i2 < layer2.length && out.length < maxSlots) {
      out.push(layer2[i2]);
      i2 += 1;
    }

    const burst = burstToggle ? 3 : 2;
    burstToggle = !burstToggle;
    let taken = 0;
    while (
      taken < burst &&
      i3 < layer3.length &&
      out.length < maxSlots
    ) {
      out.push(layer3[i3]);
      i3 += 1;
      taken += 1;
    }
  }

  return out;
};

/**
 * Asosiy yig'ish.
 *
 * @param {object} currentItem
 * @param {object[]} allItems — bir xil contentType pool
 * @param {{ limit?: number, contentType?: string }} [options]
 * @returns {Array<{ id: number, item: object, layer: string, score: number, position: number }>}
 */
const buildSimilarMusicItems = (currentItem, allItems, options = {}) => {
  const currentId = itemIdOf(currentItem);
  if (currentId == null) return [];

  const contentType = normalizeContentType(
    options.contentType || currentItem?.type
  );
  if (!contentType) return [];

  const limit = Math.max(
    1,
    Number(options.limit) || Number(similarityWeights.limit) || 10
  );
  const q1Max = Math.max(0, Number(similarityWeights.q1Max) || 0);
  const q2Max = Math.max(0, Number(similarityWeights.q2Max) || 0);

  /** @type {Map<number, object>} */
  const byId = new Map();
  for (const row of allItems || []) {
    const id = itemIdOf(row);
    if (id == null) continue;
    if (!byId.has(id)) byId.set(id, row);
  }

  const usedIds = new Set([currentId]);
  /** @type {object[]} */
  const result = [];

  // ——— QATLAM 1: franshiza (music/klip; albumda maydon yo'q → skip) ———
  const franchiseField =
    similarityWeights.franchiseFieldByType[contentType] || null;
  const franchiseIds =
    franchiseField && Array.isArray(currentItem?.[franchiseField])
      ? currentItem[franchiseField]
      : [];
  const layer1 = resolveFranchiseLayer(byId, franchiseIds, usedIds, q1Max);
  result.push(...layer1);

  const remainingAfterQ1 = Math.max(0, limit - result.length);
  if (remainingAfterQ1 <= 0) {
    return result.map((row, index) => ({
      ...row,
      position: index + 1,
    }));
  }

  const pool = [...byId.values()].filter((m) => itemIdOf(m) !== currentId);

  // ——— QATLAM 2 + 3: alohida yig'ib, keyin interleave ———
  // usedIds ni Q2/Q3 uchun vaqtinchalik ajratamiz — interleave tartibida qo'shamiz
  const usedForLayers = new Set(usedIds);
  const layer2 = resolveArtistGenreLayer(
    currentItem,
    pool,
    usedForLayers,
    q2Max
  );
  const layer3 = resolveGeneralLayer(
    currentItem,
    pool,
    usedForLayers,
    remainingAfterQ1
  );

  const mixed = interleaveArtistGenreAndGeneral(
    layer2,
    layer3,
    remainingAfterQ1
  );
  result.push(...mixed);

  return result.map((row, index) => ({
    ...row,
    position: index + 1,
  }));
};

module.exports = {
  buildSimilarMusicItems,
  computeGeneralSimilarity,
  getYearProximityScore,
  interleaveArtistGenreAndGeneral,
  artistIdOf,
  genreOf,
  countryOf,
  languageOf,
  yearOf,
  itemIdOf,
};
