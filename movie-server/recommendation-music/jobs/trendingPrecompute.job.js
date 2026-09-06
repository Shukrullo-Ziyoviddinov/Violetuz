/**
 * Background job: recompute music category trending from ListenEvents.
 * Job name: music:trending:precompute
 *
 * Shared formula: recommendation/services/trending.service (no copy).
 * Data: music_recommendation_listen_events + klip/konsert likes.
 * Writes: music_recommendation_category_trending_scores only.
 *
 * @module recommendation-music/jobs/trendingPrecompute.job
 */

'use strict';

const Music = require('../../models/Music.model');
const Album = require('../../models/Album.model');
const Clip = require('../../models/Clip.model');
const Concert = require('../../models/Concert.model');
const UserReaction = require('../../models/UserReaction.model');
const { scoringWeights } = require('../config/scoringWeights');
const { musicRecommendationQueue } = require('./musicQueue');
const {
  aggregateListenStatsByCategory,
  averageListenedSecondsByCategory,
} = require('../repositories/listenEvent.repository');
const {
  replaceCategoryTypeTrendingScores,
} = require('../repositories/trending.repository');
const { findByCategoryAndType } = require('../repositories/contentProjection.repository');
const {
  tryAcquireJobLock,
  releaseJobLock,
} = require('../../recommendation/repositories/jobLock.repository');
const {
  scoreMusicTrendingBatch,
  buildMusicPopularityFallbackScores,
} = require('../services/trending.service');

const JOB_NAME = 'music:trending:precompute';
const MS_PER_DAY = 86_400_000;

/** @type {ReturnType<typeof setInterval>|null} */
let hourlyTimer = null;

const MODEL_BY_TYPE = {
  music: Music,
  album: Album,
  clip: Clip,
  concert: Concert,
};

/**
 * Distinct categoryNameMusic × contentType from catalogs.
 * @returns {Promise<Array<{ category: string, contentType: string }>>}
 */
const listCatalogCategoryTypes = async () => {
  /** @type {Map<string, { category: string, contentType: string }>} */
  const map = new Map();

  await Promise.all(
    Object.entries(MODEL_BY_TYPE).map(async ([contentType, Model]) => {
      const names = await Model.distinct('categoryNameMusic');
      for (const n of names || []) {
        const category = String(n || '').trim();
        if (!category) continue;
        map.set(`${category}\0${contentType}`, { category, contentType });
      }
    })
  );

  return [...map.values()].sort((a, b) =>
    `${a.category}:${a.contentType}`.localeCompare(`${b.category}:${b.contentType}`)
  );
};

/**
 * Recent klip/konsert likes with decay → Map contentKey → mass
 */
const countRecentMusicLikes = async (since, opts = {}) => {
  const nowMs =
    opts.now instanceof Date
      ? opts.now.getTime()
      : typeof opts.now === 'number'
        ? opts.now
        : Date.now();
  const now = new Date(nowMs);
  const halfLifeDays = Math.max(1, Number(opts.halfLifeDays) || 15);
  const msPerDay = 86_400_000;

  const rows = await UserReaction.aggregate([
    {
      $match: {
        type: { $in: ['klip', 'konsert'] },
        value: 'like',
        updatedAt: { $gte: since, $lte: now },
      },
    },
    {
      $addFields: {
        weight: {
          $pow: [
            0.5,
            {
              $divide: [
                {
                  $divide: [{ $subtract: [now, '$updatedAt'] }, msPerDay],
                },
                halfLifeDays,
              ],
            },
          ],
        },
        contentType: {
          $cond: [{ $eq: ['$type', 'klip'] }, 'clip', 'concert'],
        },
      },
    },
    {
      $group: {
        _id: { contentType: '$contentType', contentId: '$targetId' },
        likeCount: { $sum: '$weight' },
      },
    },
  ]);

  /** @type {Map<string, number>} key = contentType\\0contentId */
  const map = new Map();
  for (const row of rows) {
    const type = String(row._id?.contentType || '').trim();
    const id = String(row._id?.contentId ?? '').trim();
    if (!type || !id) continue;
    map.set(`${type}\0${id}`, Number(row.likeCount) || 0);
  }
  return map;
};

/**
 * Map clip/concert id → categoryNameMusic
 */
const mapContentIdsToCategory = async (pairs) => {
  /** @type {Map<string, string>} key = type\\0id → category */
  const map = new Map();
  const byType = { clip: [], concert: [] };
  for (const { contentType, contentId } of pairs) {
    if (contentType === 'clip' || contentType === 'concert') {
      const n = Number(contentId);
      if (Number.isInteger(n)) byType[contentType].push(n);
    }
  }

  if (byType.clip.length) {
    const docs = await Clip.find({ id: { $in: [...new Set(byType.clip)] } })
      .select({ id: 1, categoryNameMusic: 1, _id: 0 })
      .lean();
    for (const d of docs) {
      const cat = String(d.categoryNameMusic || '').trim();
      if (cat) map.set(`clip\0${d.id}`, cat);
    }
  }
  if (byType.concert.length) {
    const docs = await Concert.find({ id: { $in: [...new Set(byType.concert)] } })
      .select({ id: 1, categoryNameMusic: 1, _id: 0 })
      .lean();
    for (const d of docs) {
      const cat = String(d.categoryNameMusic || '').trim();
      if (cat) map.set(`concert\0${d.id}`, cat);
    }
  }
  return map;
};

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
        console.error(
          '[music:trending:precompute] release lock failed:',
          err?.message || err
        );
      }
    }
  }
};

const runTrendingPrecomputeBody = async (payload = {}) => {
  const cfg = scoringWeights.trending || {};
  const windowDays = Math.max(1, Number(payload.windowDays) || cfg.windowDays || 30);
  const now = payload.now instanceof Date ? payload.now : new Date();
  const since = new Date(now.getTime() - windowDays * MS_PER_DAY);
  const halfLifeDays = Math.max(1, windowDays / 2);
  const poolSize = scoringWeights.candidatePoolSize || 400;

  const catalogPairs =
    Array.isArray(payload.categoryTypes) && payload.categoryTypes.length
      ? payload.categoryTypes
      : await listCatalogCategoryTypes();

  const [listenRows, durationMap, reactionLikes] = await Promise.all([
    aggregateListenStatsByCategory({ since, now, halfLifeDays }),
    averageListenedSecondsByCategory({ since, now, halfLifeDays }),
    countRecentMusicLikes(since, { now, halfLifeDays }),
  ]);

  const likePairs = [...reactionLikes.keys()].map((key) => {
    const [contentType, contentId] = key.split('\0');
    return { contentType, contentId };
  });
  const contentCategoryMap = await mapContentIdsToCategory(likePairs);

  /** @type {Map<string, Object>} key = category\\0type\\0id */
  const byKey = new Map();

  for (const row of listenRows) {
    const cat = String(row.category || '').trim();
    const type = String(row.contentType || '').trim();
    const id = String(row.contentId || '').trim();
    if (!cat || !type || !id) continue;
    const key = `${cat}\0${type}\0${id}`;
    byKey.set(key, {
      category: cat,
      contentType: type,
      contentId: id,
      viewCountRecent: Number(row.viewCountRecent) || 0,
      likeCount: Number(row.likeCount) || 0,
      completionRateAvg: Number(row.completionRateAvg) || 0,
      avgListenDuration: durationMap.get(key) || 0,
    });
  }

  for (const [pairKey, count] of reactionLikes.entries()) {
    const [contentType, contentId] = pairKey.split('\0');
    const cat = contentCategoryMap.get(pairKey);
    if (!cat) continue;
    const key = `${cat}\0${contentType}\0${contentId}`;
    const prev = byKey.get(key);
    if (prev) {
      prev.likeCount = (prev.likeCount || 0) + count;
    } else {
      byKey.set(key, {
        category: cat,
        contentType,
        contentId,
        viewCountRecent: 0,
        likeCount: count,
        completionRateAvg: 0,
        avgListenDuration: durationMap.get(key) || 0,
      });
    }
  }

  /** @type {Map<string, Object[]>} key = category\\0type */
  const byPair = new Map();
  for (const row of byKey.values()) {
    const pk = `${row.category}\0${row.contentType}`;
    if (!byPair.has(pk)) byPair.set(pk, []);
    byPair.get(pk).push(row);
  }

  const results = [];

  for (const { category, contentType } of catalogPairs) {
    const pk = `${category}\0${contentType}`;
    const rawRows = byPair.get(pk) || [];
    const hasListenSignal = rawRows.length > 0;

    let scored;
    if (!hasListenSignal) {
      const pool = await findByCategoryAndType(category, contentType, poolSize);
      scored = buildMusicPopularityFallbackScores(pool, category, contentType);
    } else {
      for (const row of rawRows) {
        if (!row.avgListenDuration) {
          row.avgListenDuration =
            durationMap.get(`${category}\0${contentType}\0${row.contentId}`) || 0;
        }
      }
      scored = scoreMusicTrendingBatch(rawRows, scoringWeights);
    }

    const write = await replaceCategoryTypeTrendingScores(
      category,
      contentType,
      scored
    );

    results.push({
      category,
      contentType,
      items: write.written,
      source: hasListenSignal ? 'listen_events' : 'popularity_fallback',
    });
  }

  return {
    skipped: false,
    windowDays,
    pairs: catalogPairs.length,
    results,
    generatedAt: now.toISOString(),
  };
};

const registerTrendingPrecomputeJob = (queue = musicRecommendationQueue) => {
  queue.register(JOB_NAME, handleTrendingPrecompute);
  return JOB_NAME;
};

const enqueueTrendingPrecompute = (payload = {}, queue = musicRecommendationQueue) =>
  queue.enqueue(JOB_NAME, payload, {
    coalesceKey: 'music:trending:precompute:all',
  });

const startMusicTrendingPrecomputeScheduler = (options = {}) => {
  const intervalMs =
    Number(options.intervalMs) ||
    scoringWeights.trending?.precomputeIntervalMs ||
    60 * 60 * 1000;
  const initialDelayMs = Math.max(0, Number(options.initialDelayMs) || 5_000);

  if (hourlyTimer) {
    return { started: false, reason: 'already_running', intervalMs };
  }

  const tick = () => {
    try {
      enqueueTrendingPrecompute({});
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '[music:trending:precompute] enqueue failed:',
        err?.message || err
      );
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
    `[music:trending:precompute] scheduler started (every ${Math.round(intervalMs / 60000)} min)`
  );

  return { started: true, intervalMs, initialDelayMs };
};

const stopMusicTrendingPrecomputeScheduler = () => {
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
  startMusicTrendingPrecomputeScheduler,
  stopMusicTrendingPrecomputeScheduler,
  listCatalogCategoryTypes,
};
