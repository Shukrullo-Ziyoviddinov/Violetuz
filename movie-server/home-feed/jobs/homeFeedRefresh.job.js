/**
 * Login "Siz uchun" cache ni vaqti-vaqti bilan qayta hisoblash.
 * Faqat home_feed_cache ga yoziladi.
 *
 * @module home-feed/jobs/homeFeedRefresh.job
 */

'use strict';

const { UserRecommendation, UserMovieProgress } = require('../../recommendation/models');
const { homeFeedWeights } = require('../config/homeFeedWeights');
const { HomeFeedCache } = require('../models');
const { buildHomeFeed } = require('../rank/buildFeed');
const { replaceHomeFeedCache } = require('../repositories/homeFeedCache.repository');
const { parseUserId } = require('../repositories/parseUserId');

/** @type {ReturnType<typeof setInterval>|null} */
let timer = null;
let running = false;

/**
 * Cache, ko'rish yoki bo'lim tavsiyasi bor foydalanuvchilar.
 * @returns {Promise<import('mongoose').Types.ObjectId[]>}
 */
const listHomeFeedUserIds = async () => {
  const [cached, progress, recommended] = await Promise.all([
    HomeFeedCache.distinct('userId'),
    UserMovieProgress.distinct('userId'),
    UserRecommendation.distinct('userId'),
  ]);

  /** @type {Map<string, import('mongoose').Types.ObjectId>} */
  const byId = new Map();
  for (const id of [...cached, ...progress, ...recommended]) {
    const parsed = parseUserId(id);
    if (!parsed) continue;
    byId.set(String(parsed), parsed);
  }
  return [...byId.values()];
};

/**
 * @returns {Promise<{ users: number, written: number }>}
 */
const refreshHomeFeeds = async () => {
  const userIds = await listHomeFeedUserIds();
  let written = 0;

  for (const userId of userIds) {
    const built = await buildHomeFeed({ userId });
    const saved = await replaceHomeFeedCache(userId, built.movies);
    written += saved.written;
  }

  return { users: userIds.length, written };
};

const startHomeFeedRefreshScheduler = (options = {}) => {
  const intervalMs = Number(options.intervalMs) || homeFeedWeights.precomputeIntervalMs;
  const initialDelayMs = Math.max(0, Number(options.initialDelayMs) ?? 15_000);
  if (timer) return { started: false, reason: 'already_running', intervalMs };

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await refreshHomeFeeds();
      // eslint-disable-next-line no-console
      console.log(
        `[home-feed:refresh] users=${result.users} rows=${result.written}`
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[home-feed:refresh] failed:', err?.message || err);
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

const stopHomeFeedRefreshScheduler = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  listHomeFeedUserIds,
  refreshHomeFeeds,
  startHomeFeedRefreshScheduler,
  stopHomeFeedRefreshScheduler,
};
