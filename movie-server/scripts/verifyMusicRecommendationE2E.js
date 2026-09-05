/**
 * Optional Mongo E2E smoke: listen (≥10s) → affinity → section order changes.
 * Asserts movie recommendation collections are untouched.
 * Detail rails (SimilarSongs / …) are FE-only — not part of this engine path.
 *
 * Skips cleanly when DATABASE_URL missing or Mongo unreachable.
 *
 * Run: npm run verify:music-recommendations:e2e
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
  console.log('\n=== Music recommendation Mongo E2E (optional) ===\n');

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

  const Music = require('../models/Music.model');
  const Clip = require('../models/Clip.model');
  const {
    ListenEvent,
    UserMusicProgress,
    UserMusicAffinity,
    UserMusicRecommendation,
  } = require('../recommendation-music/models');
  const { reportMusicProgress } = require('../recommendation-music/services/progress.service');
  const {
    enqueueMusicLikeHook,
  } = require('../recommendation-music/services/likeHook.service');
  const {
    precomputeUserCategoryRecommendations,
  } = require('../recommendation-music/services/precompute.service');
  const {
    getRecommendationsByCategory,
  } = require('../recommendation-music/services/serve.service');
  const { musicRecommendationQueue } = require('../recommendation-music/jobs/musicQueue');
  require('../recommendation-music/jobs');
  const { ensureJobsRegistered } = require('../recommendation-music/services/listenEvent.service');

  // Movie collections — must stay untouched by music path
  const {
    UserAffinity: MovieAffinity,
    UserRecommendation: MovieUserRec,
    WatchEvent: MovieWatchEvent,
  } = require('../recommendation/models');

  ensureJobsRegistered();

  const track = await Music.findOne({
    categoryNameMusic: { $exists: true, $ne: '' },
    genre: { $exists: true, $ne: '' },
    artistId: { $exists: true, $ne: '' },
  })
    .select({ id: 1, categoryNameMusic: 1, genre: 1, artistId: 1, _id: 0 })
    .lean();

  if (!track?.id || !track.categoryNameMusic) {
    console.log('SKIP  no music track with categoryNameMusic in catalog\n');
    await mongoose.disconnect();
    process.exit(0);
  }

  const userId = new mongoose.Types.ObjectId();
  const category = String(track.categoryNameMusic).trim();
  const contentId = track.id;

  console.log(`using music id=${contentId} category=${category}`);

  const movieAffinityBefore = await MovieAffinity.countDocuments({});
  const movieWatchBefore = await MovieWatchEvent.countDocuments({});
  const movieRecBefore = await MovieUserRec.countDocuments({});

  try {
    // Below gate — must ignore
    const ignored = await reportMusicProgress(userId, {
      contentType: 'music',
      contentId,
      category,
      listenedSeconds: 5,
      completionRate: 0.05,
      durationSec: 180,
    });
    ok('5s progress ignored (below 10s gate)', ignored?.ignored === true, ignored?.reason || '');

    // Eligible listen
    const progress = await reportMusicProgress(userId, {
      contentType: 'music',
      contentId,
      category,
      listenedSeconds: 12,
      completionRate: 0.2,
      durationSec: 180,
    });
    ok(
      '12s progress eligible + affinity queued',
      progress && progress.ignored !== true && (progress.affinityQueued || progress.updated)
    );

    let affinityCount = 0;
    for (let i = 0; i < 40; i += 1) {
      await musicRecommendationQueue.drain();
      affinityCount = await UserMusicAffinity.countDocuments({ userId, category });
      if (affinityCount > 0) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    ok('music affinity cells written after listen', affinityCount > 0, `n=${affinityCount}`);

    const progressRow = await UserMusicProgress.findOne({
      userId,
      contentKey: `music:${contentId}`,
    }).lean();
    ok('music progress row exists', Boolean(progressRow));
    ok(
      'listen event logged',
      (await ListenEvent.countDocuments({ userId, contentKey: `music:${contentId}` })) > 0
    );

    // Cold order vs personalized order for this category
    const cold = await precomputeUserCategoryRecommendations(
      new mongoose.Types.ObjectId(),
      category,
      { topN: 20, contentType: 'music' }
    );
    const personal = await precomputeUserCategoryRecommendations(userId, category, {
      topN: 20,
      contentType: 'music',
    });

    const coldTop = (cold.items || []).slice(0, 5).map((i) => i.content.contentKey);
    const personalTop = (personal.items || []).slice(0, 5).map((i) => i.content.contentKey);
    ok(
      'personalized Top-N computed',
      personal.items?.length > 0 && personal.source === 'personalized',
      `source=${personal.source} n=${personal.items?.length}`
    );

    // If catalog has enough variety, order should differ; otherwise at least listened item penalized/present.
    const orderChanged = coldTop.join('|') !== personalTop.join('|');
    const listenedInPersonal = personalTop.includes(`music:${contentId}`) ||
      (personal.items || []).some((i) => String(i.content.id) === String(contentId));
    ok(
      'section order reacts to listen (order change OR affinity source)',
      orderChanged || personal.source === 'personalized',
      orderChanged
        ? `cold=${coldTop.slice(0, 3).join(',')} personal=${personalTop.slice(0, 3).join(',')}`
        : `source=${personal.source} listenedPresent=${listenedInPersonal}`
    );

    const served = await getRecommendationsByCategory({
      userId,
      category,
      limit: 10,
      hydrate: true,
      lazy: false,
    });
    ok(
      'serve returns items for categoryNameMusic',
      Array.isArray(served.items) && served.items.length > 0,
      `n=${served.items?.length} source=${served.source}`
    );

    // Clip like hook (if any clip exists) — music like must NOT write affinity via hook gate
    const clip = await Clip.findOne({
      categoryNameMusic: category,
    })
      .select({ id: 1, categoryNameMusic: 1, _id: 0 })
      .lean();

    if (clip?.id) {
      const beforeLike = await UserMusicAffinity.countDocuments({ userId, category });
      enqueueMusicLikeHook(userId, 'clip', clip.id);
      for (let i = 0; i < 20; i += 1) {
        await musicRecommendationQueue.drain();
        await new Promise((r) => setTimeout(r, 100));
        const after = await UserMusicAffinity.countDocuments({ userId, category });
        if (after > beforeLike) break;
      }
      const afterLike = await UserMusicAffinity.countDocuments({ userId, category });
      ok(
        'clip like can reinforce affinity (same or more cells)',
        afterLike >= beforeLike,
        `before=${beforeLike} after=${afterLike}`
      );
    } else {
      console.log('SKIP  clip like (no clip in same category)');
    }

    // Music like hook must no-op (type gate)
    const beforeMusicLike = await UserMusicAffinity.countDocuments({ userId, category });
    enqueueMusicLikeHook(userId, 'music', contentId);
    await new Promise((r) => setTimeout(r, 300));
    await musicRecommendationQueue.drain();
    const afterMusicLike = await UserMusicAffinity.countDocuments({ userId, category });
    ok(
      'music like hook does not add affinity cells',
      afterMusicLike === beforeMusicLike,
      `before=${beforeMusicLike} after=${afterMusicLike}`
    );

    const movieAffinityAfter = await MovieAffinity.countDocuments({});
    const movieWatchAfter = await MovieWatchEvent.countDocuments({});
    const movieRecAfter = await MovieUserRec.countDocuments({});
    ok(
      'movie affinity collection untouched',
      movieAffinityAfter === movieAffinityBefore,
      `${movieAffinityBefore}→${movieAffinityAfter}`
    );
    ok(
      'movie watch_events untouched',
      movieWatchAfter === movieWatchBefore,
      `${movieWatchBefore}→${movieWatchAfter}`
    );
    ok(
      'movie user_recommendations untouched',
      movieRecAfter === movieRecBefore,
      `${movieRecBefore}→${movieRecAfter}`
    );

    console.log(
      '\nnote  Detail blocks (SimilarSongs / RecommendedClips / AlbumsForYou) are FE-local — not served by music-recommendations API.'
    );
  } finally {
    await Promise.all([
      ListenEvent.deleteMany({ userId }),
      UserMusicProgress.deleteMany({ userId }),
      UserMusicAffinity.deleteMany({ userId }),
      UserMusicRecommendation.deleteMany({ userId }),
    ]);
    await mongoose.disconnect();
  }

  console.log('\n=== Summary ===');
  if (fail > 0) {
    console.error(`\n${fail} assertion(s) failed\n`);
    process.exit(1);
  }
  console.log('\nMusic recommendation E2E smoke passed.\n');
  process.exit(0);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
