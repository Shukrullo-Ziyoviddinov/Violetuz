/**
 * Music similar cache precompute.
 * Sahifa ochilganda hisoblanmaydi — faqat job yozadi.
 * movie-similar / recommendation / music-mixes navbatiga yozilmaydi.
 *
 * @module music-similar/jobs/musicSimilarityPrecompute.job
 */

'use strict';

const { similarityWeights } = require('../config/similarityWeights');
const { buildSimilarMusicItems } = require('../services/similarMusicEngine');
const {
  listAllCatalogItems,
  toCatalogId,
  normalizeContentType,
} = require('../repositories/catalog.read');
const { replaceSimilarForSource } = require('../repositories/similarCache.repository');

/** @type {ReturnType<typeof setInterval>|null} */
let timer = null;
/** @type {ReturnType<typeof setTimeout>|null} */
let bootTimer = null;
let running = false;

/**
 * Bitta yozuv: engine → cache.
 * @param {string} contentType
 * @param {object} currentItem
 * @param {object[]} allItems
 * @returns {Promise<number>} written rows
 */
const recomputeOne = async (contentType, currentItem, allItems) => {
  const type = normalizeContentType(contentType);
  const id = toCatalogId(currentItem?.id);
  if (!type || id == null) return 0;

  const built = buildSimilarMusicItems(currentItem, allItems, {
    limit: similarityWeights.limit,
    contentType: type,
  });
  const rows = built.map((row) => ({
    similarId: row.id,
    position: row.position,
    layer: row.layer,
    score: row.score,
  }));
  const saved = await replaceSimilarForSource(type, id, rows);
  return saved.written;
};

/**
 * Bitta contentType katalogini to'liq yangilash.
 * @param {unknown} contentType
 * @returns {Promise<{ items: number, written: number }>}
 */
const refreshAllSimilarForType = async (contentType) => {
  const type = normalizeContentType(contentType);
  if (!type) return { items: 0, written: 0 };

  const allItems = await listAllCatalogItems(type);
  let written = 0;
  for (const item of allItems) {
    written += await recomputeOne(type, item, allItems);
  }
  return { items: allItems.length, written };
};

/**
 * music + klip + album — concert skip.
 * @returns {Promise<{ items: number, written: number, byType: Record<string, { items: number, written: number }> }>}
 */
const refreshAllSimilarMusicItems = async () => {
  /** @type {Record<string, { items: number, written: number }>} */
  const byType = {};
  let items = 0;
  let written = 0;

  for (const type of similarityWeights.contentTypes) {
    const result = await refreshAllSimilarForType(type);
    byType[type] = result;
    items += result.items;
    written += result.written;
  }

  return { items, written, byType };
};

const startMusicSimilarityPrecomputeScheduler = (options = {}) => {
  const intervalMs =
    Number(options.intervalMs) || similarityWeights.precomputeIntervalMs;
  const initialDelayMs = Math.max(0, Number(options.initialDelayMs) ?? 50_000);
  if (timer || bootTimer) {
    return { started: false, reason: 'already_running', intervalMs };
  }

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await refreshAllSimilarMusicItems();
      // eslint-disable-next-line no-console
      console.log(
        `[music-similar:precompute] items=${result.items} rows=${result.written}` +
          ` music=${result.byType.music?.written || 0}` +
          ` klip=${result.byType.klip?.written || 0}` +
          ` album=${result.byType.album?.written || 0}`
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[music-similar:precompute] failed:', err?.message || err);
    } finally {
      running = false;
    }
  };

  if (options.runImmediately !== false) {
    bootTimer = setTimeout(() => {
      bootTimer = null;
      tick();
    }, initialDelayMs);
    if (typeof bootTimer.unref === 'function') bootTimer.unref();
  }

  timer = setInterval(tick, intervalMs);
  if (typeof timer.unref === 'function') timer.unref();
  return { started: true, intervalMs, initialDelayMs };
};

const stopMusicSimilarityPrecomputeScheduler = () => {
  if (bootTimer) {
    clearTimeout(bootTimer);
    bootTimer = null;
  }
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  recomputeOne,
  refreshAllSimilarForType,
  refreshAllSimilarMusicItems,
  startMusicSimilarityPrecomputeScheduler,
  stopMusicSimilarityPrecomputeScheduler,
};
