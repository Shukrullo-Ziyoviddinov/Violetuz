/**
 * Optional Mongo E2E: progress → affinity → like → blend serve path (smoke).
 *
 * Skips cleanly when DATABASE_URL missing or Mongo unreachable.
 *
 * Run: npm run verify:recommendations:e2e
 */

'use strict';

require('dotenv').config();

const mongoose = require('mongoose');

let fail = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) {
    fail += 1;
    console.error(`FAIL  ${name}${extra ? ` — ${extra}` : ''}`);
    return;
  }
  console.log(`ok    ${name}${extra ? ` — ${extra}` : ''}`);
};

const main = async () => {
  console.log('\n=== Recommendation Mongo E2E (optional) ===\n');

  if (!process.env.DATABASE_URL) {
    console.log('SKIP  DATABASE_URL not set — E2E not run\n');
    process.exit(0);
  }

  try {
    const connectDB = require('../config/db');
    await connectDB();
  } catch (err) {
    console.log(`SKIP  Mongo connect failed: ${err.message}\n`);
    process.exit(0);
  }

  const Movie = require('../models/Movie.model');
  const UserReaction = require('../models/UserReaction.model');
  const {
    UserMovieProgress,
    UserAffinity,
    UserRecommendation,
    WatchEvent,
  } = require('../recommendation/models');
  const { reportMovieProgress } = require('../recommendation/services/progress.service');
  const { enqueueMovieLikeHook } = require('../recommendation/services/likeHook.service');
  const {
    precomputeUserCategoryRecommendations,
  } = require('../recommendation/services/precompute.service');
  const {
    getRecommendationsByCategory,
  } = require('../recommendation/services/serve.service');
  const { recommendationQueue } = require('../recommendation/jobs/inProcessQueue');
  const { ensureJobsRegistered } = require('../recommendation/services/watchEvent.service');

  ensureJobsRegistered();

  const movie = await Movie.findOne({ categoryName: { $exists: true, $ne: '' } })
    .select({ id: 1, categoryName: 1, _id: 0 })
    .lean();

  if (!movie?.id || !movie.categoryName) {
    console.log('SKIP  no movie with categoryName in catalog\n');
    await mongoose.disconnect();
    process.exit(0);
  }

  const userId = new mongoose.Types.ObjectId();
  const category = String(movie.categoryName).trim();
  const movieId = movie.id;

  console.log(`using movie id=${movieId} category=${category}`);

  try {
    const progress = await reportMovieProgress(userId, {
      movieId,
      category,
      watchedSeconds: 600,
      completionRate: 0.5,
      durationSec: 1200,
    });
    ok(
      'progress eligible + affinity queued or updated',
      progress && progress.ignored !== true && (progress.affinityQueued || progress.updated)
    );

    // Durable queue persists then enqueues — poll until affinity cells appear.
    let affinityCount = 0;
    for (let i = 0; i < 40; i += 1) {
      await recommendationQueue.drain();
      affinityCount = await UserAffinity.countDocuments({ userId, category });
      if (affinityCount > 0) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    ok('affinity cells written after progress', affinityCount > 0, `n=${affinityCount}`);

    enqueueMovieLikeHook(userId, movieId);
    await new Promise((r) => setTimeout(r, 800));
    await recommendationQueue.drain();

    const like = await UserReaction.findOneAndUpdate(
      { userId, type: 'movie', targetId: String(movieId) },
      {
        $set: { value: 'like', snapshot: { id: movieId } },
        $setOnInsert: { userId, type: 'movie', targetId: String(movieId) },
      },
      { upsert: true, new: true, lean: true }
    );
    ok('UserReaction like present', Boolean(like && like.value === 'like'));

    // Re-fire like hook after reaction exists (experience path)
    enqueueMovieLikeHook(userId, movieId);
    await new Promise((r) => setTimeout(r, 500));
    await recommendationQueue.drain();

    const pre = await precomputeUserCategoryRecommendations(userId, category, {
      topN: 20,
    });
    ok('precompute wrote rows', pre.written > 0, `written=${pre.written}`);
    ok(
      'precompute blend meta has alpha',
      typeof pre.alpha === 'number' && pre.alpha >= 0
    );

    const served = await getRecommendationsByCategory({
      userId,
      category,
      limit: 10,
      hydrate: false,
      lazy: false,
    });
    ok(
      'serve returns cache/realtime items',
      Array.isArray(served.items) && served.items.length > 0,
      `source=${served.source} n=${served.items?.length || 0}`
    );
  } catch (err) {
    fail += 1;
    console.error('FAIL  e2e threw:', err?.message || err);
  } finally {
    await Promise.all([
      UserMovieProgress.deleteMany({ userId }),
      UserAffinity.deleteMany({ userId }),
      UserRecommendation.deleteMany({ userId }),
      WatchEvent.deleteMany({ userId }),
      UserReaction.deleteMany({ userId }),
    ]);
    await mongoose.disconnect();
  }

  console.log(`\n${fail === 0 ? 'E2E PASSED' : `E2E FAILED: ${fail}`}\n`);
  process.exit(fail === 0 ? 0 : 1);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
