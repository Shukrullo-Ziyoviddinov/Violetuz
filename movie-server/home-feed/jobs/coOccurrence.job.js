/**
 * Kunlik: watch_events dan birga ko'rilgan juftliklar.
 * Faqat home_feed_movie_co_occurrence ga yoziladi.
 *
 * @module home-feed/jobs/coOccurrence.job
 */

'use strict';

const { WatchEvent } = require('../../recommendation/models');
const { homeFeedWeights } = require('../config/homeFeedWeights');
const { excludedCategoryMatch } = require('../repositories/excludedCategory');
const { isWatchedProgress } = require('../repositories/watchProgress.read');
const { replaceCoOccurrence } = require('../repositories/coOccurrence.repository');

/** @type {ReturnType<typeof setInterval>|null} */
let timer = null;
let running = false;

/**
 * @param {Map<string, Set<string>>} byUser
 * @param {number} minCount
 * @returns {Array<{ movieIdA: string, movieIdB: string, coWatchCount: number }>}
 */
const pairsFromWatchers = (byUser, minCount) => {
  /** @type {Map<string, number>} */
  const counts = new Map();

  for (const movies of byUser.values()) {
    const ids = [...movies];
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const left = ids[i] < ids[j] ? ids[i] : ids[j];
        const right = ids[i] < ids[j] ? ids[j] : ids[i];
        const key = `${left}\0${right}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
  }

  /** @type {Array<{ movieIdA: string, movieIdB: string, coWatchCount: number }>} */
  const pairs = [];
  for (const [key, count] of counts) {
    if (count < minCount) continue;
    const [left, right] = key.split('\0');
    pairs.push({ movieIdA: left, movieIdB: right, coWatchCount: count });
    pairs.push({ movieIdA: right, movieIdB: left, coWatchCount: count });
  }
  return pairs;
};

/**
 * @returns {Promise<{ users: number, written: number }>}
 */
const refreshCoOccurrence = async () => {
  const cfg = homeFeedWeights.coOccurrence || {};
  const minCount = Math.max(1, cfg.minCount ?? 3);
  const maxMovies = Math.max(2, cfg.maxMoviesPerUser ?? 40);

  const rows = await WatchEvent.find({
    ...excludedCategoryMatch(),
  })
    .select({ userId: 1, movieId: 1, watchedSeconds: 1, completionRate: 1, watchedAt: 1, _id: 0 })
    .sort({ watchedAt: -1 })
    .lean();

  /** @type {Map<string, Set<string>>} */
  const byUser = new Map();
  for (const row of rows || []) {
    const watchedSeconds = Math.max(0, Number(row.watchedSeconds) || 0);
    const completionRate = Math.min(1, Math.max(0, Number(row.completionRate) || 0));
    if (!isWatchedProgress(watchedSeconds, completionRate)) continue;
    const userId = String(row.userId || '');
    const movieId = String(row.movieId || '').trim();
    if (!userId || !movieId) continue;
    if (!byUser.has(userId)) byUser.set(userId, new Set());
    const bucket = byUser.get(userId);
    if (bucket.size >= maxMovies) continue;
    bucket.add(movieId);
  }

  const pairs = pairsFromWatchers(byUser, minCount);
  const { written } = await replaceCoOccurrence(pairs);
  return { users: byUser.size, written };
};

const startCoOccurrenceScheduler = (options = {}) => {
  const intervalMs = Number(options.intervalMs) || homeFeedWeights.coOccurrence.precomputeIntervalMs;
  const initialDelayMs = Math.max(0, Number(options.initialDelayMs) ?? 20_000);
  if (timer) return { started: false, reason: 'already_running', intervalMs };

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await refreshCoOccurrence();
      // eslint-disable-next-line no-console
      console.log(
        `[home-feed:co-occurrence] users=${result.users} pairs=${result.written}`
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[home-feed:co-occurrence] failed:', err?.message || err);
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

const stopCoOccurrenceScheduler = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  pairsFromWatchers,
  refreshCoOccurrence,
  startCoOccurrenceScheduler,
  stopCoOccurrenceScheduler,
};
