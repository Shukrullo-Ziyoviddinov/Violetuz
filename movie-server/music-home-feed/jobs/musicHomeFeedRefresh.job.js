/**
 * Login "Sizga mos musiqalar" keshini vaqti-vaqti bilan qayta hisoblash.
 * Faqat music_home_feed_cache ga yoziladi. Bo'lim navbatiga yozilmaydi.
 *
 * @module music-home-feed/jobs/musicHomeFeedRefresh.job
 */

'use strict';

const {
  UserMusicProgress,
  UserMusicRecommendation,
} = require('../../recommendation-music/models');
const { musicHomeFeedWeights } = require('../config/musicHomeFeedWeights');
const { MusicHomeFeedCache } = require('../models');
const { musicContentMatch } = require('../repositories/musicContent');
const { buildMusicFeed } = require('../rank/buildFeed');
const { replaceMusicHomeFeedCache } = require('../repositories/musicHomeFeedCache.repository');
const { parseUserId } = require('../repositories/parseUserId');

/** @type {ReturnType<typeof setInterval>|null} */
let timer = null;
let running = false;

/**
 * Kesh, qo'shiq eshitishi yoki qo'shiq tavsiyasi bor foydalanuvchilar.
 * @returns {Promise<import('mongoose').Types.ObjectId[]>}
 */
const listMusicHomeFeedUserIds = async () => {
  const musicOnly = musicContentMatch();
  const [cached, progress, recommended] = await Promise.all([
    MusicHomeFeedCache.distinct('userId'),
    UserMusicProgress.distinct('userId', musicOnly),
    UserMusicRecommendation.distinct('userId', musicOnly),
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
const refreshMusicHomeFeeds = async () => {
  const userIds = await listMusicHomeFeedUserIds();
  let written = 0;

  for (const userId of userIds) {
    const built = await buildMusicFeed({ userId });
    const saved = await replaceMusicHomeFeedCache(userId, built.tracks);
    written += saved.written;
  }

  return { users: userIds.length, written };
};

const startMusicHomeFeedRefreshScheduler = (options = {}) => {
  const intervalMs = Number(options.intervalMs) || musicHomeFeedWeights.precomputeIntervalMs;
  const initialDelayMs = Math.max(0, Number(options.initialDelayMs) ?? 25_000);
  if (timer) return { started: false, reason: 'already_running', intervalMs };

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await refreshMusicHomeFeeds();
      // eslint-disable-next-line no-console
      console.log(
        `[music-home-feed:refresh] users=${result.users} rows=${result.written}`
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[music-home-feed:refresh] failed:', err?.message || err);
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

const stopMusicHomeFeedRefreshScheduler = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  listMusicHomeFeedUserIds,
  refreshMusicHomeFeeds,
  startMusicHomeFeedRefreshScheduler,
  stopMusicHomeFeedRefreshScheduler,
};
