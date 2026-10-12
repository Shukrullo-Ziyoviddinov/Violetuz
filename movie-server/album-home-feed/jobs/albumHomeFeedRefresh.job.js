/**
 * Login "Siz uchun albomlar" keshini vaqti-vaqti bilan qayta hisoblash.
 * Faqat album_home_feed_cache ga yoziladi. Musiqa keshiga va bo'lim navbatiga yozilmaydi.
 *
 * @module album-home-feed/jobs/albumHomeFeedRefresh.job
 */

'use strict';

const {
  UserMusicProgress,
  UserMusicRecommendation,
} = require('../../recommendation-music/models');
const { albumHomeFeedWeights } = require('../config/albumHomeFeedWeights');
const { AlbumHomeFeedCache } = require('../models');
const { albumContentMatch } = require('../repositories/albumContent');
const { buildAlbumFeed } = require('../rank/buildFeed');
const { replaceAlbumHomeFeedCache } = require('../repositories/albumHomeFeedCache.repository');
const { parseUserId } = require('../repositories/parseUserId');

/** @type {ReturnType<typeof setInterval>|null} */
let timer = null;
let running = false;

/**
 * Kesh, albom eshitishi yoki albom tavsiyasi bor foydalanuvchilar.
 * @returns {Promise<import('mongoose').Types.ObjectId[]>}
 */
const listAlbumHomeFeedUserIds = async () => {
  const albumOnly = albumContentMatch();
  const [cached, progress, recommended] = await Promise.all([
    AlbumHomeFeedCache.distinct('userId'),
    UserMusicProgress.distinct('userId', albumOnly),
    UserMusicRecommendation.distinct('userId', albumOnly),
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
const refreshAlbumHomeFeeds = async () => {
  const userIds = await listAlbumHomeFeedUserIds();
  let written = 0;

  for (const userId of userIds) {
    const built = await buildAlbumFeed({ userId });
    const saved = await replaceAlbumHomeFeedCache(userId, built.albums);
    written += saved.written;
  }

  return { users: userIds.length, written };
};

const startAlbumHomeFeedRefreshScheduler = (options = {}) => {
  const intervalMs = Number(options.intervalMs) || albumHomeFeedWeights.precomputeIntervalMs;
  const initialDelayMs = Math.max(0, Number(options.initialDelayMs) ?? 55_000);
  if (timer) return { started: false, reason: 'already_running', intervalMs };

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await refreshAlbumHomeFeeds();
      // eslint-disable-next-line no-console
      console.log(
        `[album-home-feed:refresh] users=${result.users} rows=${result.written}`
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[album-home-feed:refresh] failed:', err?.message || err);
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

const stopAlbumHomeFeedRefreshScheduler = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  listAlbumHomeFeedUserIds,
  refreshAlbumHomeFeeds,
  startAlbumHomeFeedRefreshScheduler,
  stopAlbumHomeFeedRefreshScheduler,
};
