/**
 * Kunlik: tinglash hodisasidan birga eshitilgan juftliklar.
 * Faqat music_home_feed_co_occurrence ga yoziladi.
 * Faqat contentType music. Tinglandi — isListenGateOpen.
 * Bo'lim navbatiga yozilmaydi.
 *
 * @module music-home-feed/jobs/coListen.job
 */

'use strict';

const { ListenEvent } = require('../../recommendation-music/models');
const { musicHomeFeedWeights } = require('../config/musicHomeFeedWeights');
const { musicContentMatch, isMusicContentType } = require('../repositories/musicContent');
const { isListenedTrack } = require('../repositories/listened');
const { mapDurationByIds } = require('../repositories/catalog.read');
const { replaceCoOccurrence } = require('../repositories/coOccurrence.repository');

/** @type {ReturnType<typeof setInterval>|null} */
let timer = null;
let running = false;

/**
 * @param {Map<string, Set<string>>} byUser
 * @param {number} minCount
 * @returns {Array<{ contentIdA: string, contentIdB: string, coListenCount: number }>}
 */
const pairsFromListeners = (byUser, minCount) => {
  /** @type {Map<string, number>} */
  const counts = new Map();

  for (const tracks of byUser.values()) {
    const ids = [...tracks];
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const left = ids[i] < ids[j] ? ids[i] : ids[j];
        const right = ids[i] < ids[j] ? ids[j] : ids[i];
        const key = `${left}\0${right}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
  }

  /** @type {Array<{ contentIdA: string, contentIdB: string, coListenCount: number }>} */
  const pairs = [];
  for (const [key, count] of counts) {
    if (count < minCount) continue;
    const [left, right] = key.split('\0');
    pairs.push({ contentIdA: left, contentIdB: right, coListenCount: count });
    pairs.push({ contentIdA: right, contentIdB: left, coListenCount: count });
  }
  return pairs;
};

/**
 * @returns {Promise<{ users: number, written: number }>}
 */
const refreshCoListen = async () => {
  const cfg = musicHomeFeedWeights.coOccurrence || {};
  const minCount = Math.max(1, cfg.minCount ?? 3);
  const maxTracks = Math.max(2, cfg.maxTracksPerUser ?? 40);

  const rows = await ListenEvent.find({
    ...musicContentMatch(),
  })
    .select({
      userId: 1,
      contentId: 1,
      contentType: 1,
      listenedSeconds: 1,
      completionRate: 1,
      listenedAt: 1,
      _id: 0,
    })
    .sort({ listenedAt: -1 })
    .lean();

  const durations = await mapDurationByIds((rows || []).map((row) => row.contentId));

  /** @type {Map<string, Set<string>>} */
  const byUser = new Map();
  for (const row of rows || []) {
    if (!isMusicContentType(row.contentType)) continue;
    const contentId = String(row.contentId || '').trim();
    const userId = String(row.userId || '');
    if (!userId || !contentId) continue;
    const listenedSeconds = Math.max(0, Number(row.listenedSeconds) || 0);
    const completionRate = Math.min(1, Math.max(0, Number(row.completionRate) || 0));
    const durationSec = durations.has(contentId) ? durations.get(contentId) : null;
    if (!isListenedTrack(listenedSeconds, completionRate, durationSec)) continue;
    if (!byUser.has(userId)) byUser.set(userId, new Set());
    const bucket = byUser.get(userId);
    if (bucket.size >= maxTracks) continue;
    bucket.add(contentId);
  }

  const pairs = pairsFromListeners(byUser, minCount);
  const { written } = await replaceCoOccurrence(pairs);
  return { users: byUser.size, written };
};

const startCoListenScheduler = (options = {}) => {
  const intervalMs = Number(options.intervalMs)
    || musicHomeFeedWeights.coOccurrence.precomputeIntervalMs;
  const initialDelayMs = Math.max(0, Number(options.initialDelayMs) ?? 30_000);
  if (timer) return { started: false, reason: 'already_running', intervalMs };

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await refreshCoListen();
      // eslint-disable-next-line no-console
      console.log(
        `[music-home-feed:co-listen] users=${result.users} pairs=${result.written}`
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[music-home-feed:co-listen] failed:', err?.message || err);
    } finally {
      running = false;
    }
  };

  if (options.runImmediately !== false) {
    const bootTimer = setTimeout(tick, initialDelayMs);
    if (typeof bootTimer.unref === 'function') bootTimer.unref();
  }

  timer = setInterval(tick, intervalMs);
  if (typeof timer.unref === 'function') timer.unref();
  return { started: true, intervalMs, initialDelayMs };
};

const stopCoListenScheduler = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  pairsFromListeners,
  refreshCoListen,
  startCoListenScheduler,
  stopCoListenScheduler,
};
