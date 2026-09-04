/**
 * Background job: recompute category_trending_scores from recent watch_events.
 *
 * Job name: trending:precompute
 * Payload: { windowDays?, categories? } — optional overrides
 *
 * Flow:
 *   watch_events (last N days, recency decay) + progress avg duration + reaction likes
 *   → trending.service.scoreTrendingBatch
 *   → replaceCategoryTrendingScores
 * Empty category → buildPopularityFallbackScores (trendingScore = popularity; components = 0)
 *
 * @module recommendation/jobs/trendingPrecompute.job
 */

'use strict';

const Movie = require('../../models/Movie.model');
const UserReaction = require('../../models/UserReaction.model');
const { scoringWeights } = require('../config/scoringWeights');
const { recommendationQueue } = require('./inProcessQueue');
const {
  aggregateWatchStatsByCategory,
} = require('../repositories/watchEvent.repository');
const {
  averageWatchedSecondsByCategory,
} = require('../repositories/userMovieProgress.repository');
const {
  replaceCategoryTrendingScores,
} = require('../repositories/trending.repository');
const {
  tryAcquireJobLock,
  releaseJobLock,
} = require('../repositories/jobLock.repository');
const { findMoviesByCategory } = require('../repositories/movieProjection.repository');
const {
  scoreTrendingBatch,
  buildPopularityFallbackScores,
} = require('../services/trending.service');

const JOB_NAME = 'trending:precompute';

const MS_PER_DAY = 86_400_000;

/** @type {ReturnType<typeof setInterval>|null} */
let hourlyTimer = null;

/**
 * Distinct categoryName values from catalog.
 * @returns {Promise<string[]>}
 */
const listCatalogCategories = async () => {
  const names = await Movie.distinct('categoryName');
  return (names || [])
    .map((n) => String(n || '').trim())
    .filter(Boolean)
    .sort();
};

/**
 * Movie likes from UserReaction (watch_events.liked ko‘pincha bo‘sh — like hook WatchEvent yozmaydi).
 * @param {Date} since
 * @returns {Promise<Map<string, number>>} key = movieId → count
 */
const countRecentMovieLikes = async (since) => {
  const rows = await UserReaction.aggregate([
    {
      $match: {
        type: 'movie',
        value: 'like',
        updatedAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: '$targetId',
        likeCount: { $sum: 1 },
      },
    },
  ]);

  /** @type {Map<string, number>} */
  const map = new Map();
  for (const row of rows) {
    if (row._id == null) continue;
    map.set(String(row._id), Number(row.likeCount) || 0);
  }
  return map;
};

/**
 * Map movieId → categoryName for like merge.
 * @param {string[]} movieIds
 * @returns {Promise<Map<string, string>>}
 */
const mapMovieIdsToCategory = async (movieIds) => {
  /** @type {Map<string, string>} */
  const map = new Map();
  const ids = [...new Set(movieIds.map((id) => Number(id)).filter((n) => Number.isInteger(n)))];
  if (!ids.length) return map;

  const docs = await Movie.find({ id: { $in: ids } })
    .select({ id: 1, categoryName: 1, _id: 0 })
    .lean();

  for (const doc of docs) {
    const cat = String(doc.categoryName || '').trim();
    if (cat) map.set(String(doc.id), cat);
  }
  return map;
};

/**
 * Empty category: store explicit popularity as trendingScore (no fake view/duration fields).
 * @param {string} category
 * @param {number} poolSize
 * @returns {Promise<Object[]>}
 */
const buildPopularityFallbackRows = async (category, poolSize) => {
  const movies = await findMoviesByCategory(category, poolSize);
  return buildPopularityFallbackScores(movies, category);
};

/**
 * @param {Object} [payload]
 * @returns {Promise<Object>}
 */
const handleTrendingPrecompute = async (payload = {}) => {
  const cfg = scoringWeights.trending || {};
  const lockTtlMs = Math.max(60_000, Number(cfg.lockTtlMs) || 45 * 60 * 1000);
  const skipLock = payload.skipLock === true;

  let lockOwner = null;
  if (!skipLock) {
    const lock = await tryAcquireJobLock(JOB_NAME, lockTtlMs);
    if (!lock.acquired) {
      return {
        skipped: true,
        reason: 'lock_held',
        generatedAt: new Date().toISOString(),
      };
    }
    lockOwner = lock.owner;
  }

  try {
    return await runTrendingPrecomputeBody(payload);
  } finally {
    if (lockOwner) {
      try {
        await releaseJobLock(JOB_NAME, lockOwner);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[trending:precompute] release lock failed:', err?.message || err);
      }
    }
  }
};

/**
 * @param {Object} [payload]
 * @returns {Promise<Object>}
 */
const runTrendingPrecomputeBody = async (payload = {}) => {
  const cfg = scoringWeights.trending || {};
  const windowDays = Math.max(1, Number(payload.windowDays) || cfg.windowDays || 30);
  const now = payload.now instanceof Date ? payload.now : new Date();
  const since = new Date(now.getTime() - windowDays * MS_PER_DAY);
  const halfLifeDays = Math.max(1, windowDays / 2);
  const poolSize = scoringWeights.candidatePoolSize || 400;

  const categories =
    Array.isArray(payload.categories) && payload.categories.length
      ? payload.categories.map((c) => String(c).trim()).filter(Boolean)
      : await listCatalogCategories();

  const [watchRows, durationMap, reactionLikes] = await Promise.all([
    aggregateWatchStatsByCategory({ since, now, halfLifeDays }),
    averageWatchedSecondsByCategory({ since }),
    countRecentMovieLikes(since),
  ]);

  const likeMovieIds = [...reactionLikes.keys()];
  const movieCategoryMap = await mapMovieIdsToCategory(likeMovieIds);

  /** @type {Map<string, Object>} key = category\0movieId */
  const byKey = new Map();

  for (const row of watchRows) {
    const cat = String(row.category || '').trim();
    const movieId = String(row.movieId || '').trim();
    if (!cat || !movieId) continue;
    const key = `${cat}\0${movieId}`;
    byKey.set(key, {
      movieId,
      category: cat,
      viewCountRecent: Number(row.viewCountRecent) || 0,
      likeCount: Number(row.likeCount) || 0,
      completionRateAvg: Number(row.completionRateAvg) || 0,
      avgWatchDuration: durationMap.get(key) || 0,
    });
  }

  // Reaction likes → likeCount (category orqali)
  for (const [movieId, count] of reactionLikes.entries()) {
    const cat = movieCategoryMap.get(String(movieId));
    if (!cat) continue;
    const key = `${cat}\0${movieId}`;
    const prev = byKey.get(key);
    if (prev) {
      prev.likeCount = (prev.likeCount || 0) + count;
    } else {
      byKey.set(key, {
        movieId: String(movieId),
        category: cat,
        viewCountRecent: 0,
        likeCount: count,
        completionRateAvg: 0,
        avgWatchDuration: durationMap.get(key) || 0,
      });
    }
  }

  /** @type {Map<string, Object[]>} */
  const byCategory = new Map();
  for (const row of byKey.values()) {
    if (!byCategory.has(row.category)) byCategory.set(row.category, []);
    byCategory.get(row.category).push(row);
  }

  const results = [];

  for (const category of categories) {
    let scored;
    const hasWatchSignal = (byCategory.get(category) || []).length > 0;

    if (!hasWatchSignal) {
      scored = await buildPopularityFallbackRows(category, poolSize);
    } else {
      const rawRows = byCategory.get(category) || [];
      for (const row of rawRows) {
        if (!row.avgWatchDuration) {
          row.avgWatchDuration =
            durationMap.get(`${category}\0${row.movieId}`) || 0;
        }
      }
      scored = scoreTrendingBatch(rawRows, scoringWeights);
    }

    const write = await replaceCategoryTrendingScores(category, scored);

    results.push({
      category,
      movies: write.written,
      source: hasWatchSignal ? 'watch_events' : 'popularity_fallback',
    });
  }

  return {
    skipped: false,
    windowDays,
    categories: categories.length,
    results,
    generatedAt: now.toISOString(),
  };
};

const registerTrendingPrecomputeJob = (queue = recommendationQueue) => {
  queue.register(JOB_NAME, handleTrendingPrecompute);
  return JOB_NAME;
};

/**
 * @param {Object} [payload]
 * @param {import('./inProcessQueue').InProcessQueue} [queue]
 */
const enqueueTrendingPrecompute = (payload = {}, queue = recommendationQueue) =>
  queue.enqueue(JOB_NAME, payload, { coalesceKey: 'trending:precompute:all' });

/**
 * Soatlik cron (in-process). Server boot’da connectDB dan keyin chaqiriladi.
 * @param {Object} [options]
 * @param {boolean} [options.runImmediately=true]
 * @param {number} [options.intervalMs]
 * @param {number} [options.initialDelayMs=5000]
 */
const startTrendingPrecomputeScheduler = (options = {}) => {
  const intervalMs =
    Number(options.intervalMs) ||
    scoringWeights.trending?.precomputeIntervalMs ||
    60 * 60 * 1000;
  const initialDelayMs = Math.max(
    0,
    Number(options.initialDelayMs) || 5_000
  );

  if (hourlyTimer) return { started: false, reason: 'already_running', intervalMs };

  const tick = () => {
    try {
      enqueueTrendingPrecompute({});
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[trending:precompute] enqueue failed:', err?.message || err);
    }
  };

  if (options.runImmediately !== false) {
    const bootTimer = setTimeout(tick, initialDelayMs);
    if (typeof bootTimer.unref === 'function') bootTimer.unref();
  }

  hourlyTimer = setInterval(tick, intervalMs);
  if (typeof hourlyTimer.unref === 'function') hourlyTimer.unref();

  // eslint-disable-next-line no-console
  console.log(
    `[trending:precompute] scheduler started (every ${Math.round(intervalMs / 60000)} min)`
  );

  return { started: true, intervalMs, initialDelayMs };
};

const stopTrendingPrecomputeScheduler = () => {
  if (hourlyTimer) {
    clearInterval(hourlyTimer);
    hourlyTimer = null;
  }
};

module.exports = {
  JOB_NAME,
  handleTrendingPrecompute,
  registerTrendingPrecomputeJob,
  enqueueTrendingPrecompute,
  startTrendingPrecomputeScheduler,
  stopTrendingPrecomputeScheduler,
  listCatalogCategories,
  buildPopularityFallbackRows,
};
