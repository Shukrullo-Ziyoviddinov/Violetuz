'use strict';

/**
 * Album cumulative listen: trek1 + trek2 = jami daqiqa (kino completion kabi).
 * Run: node scripts/verifyAlbumCumulativeProgress.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await require('../config/db')();
  const Album = require('../models/Album.model');
  const ContentView = require('../models/ContentView.model');
  const { reportMusicProgress } = require('../recommendation-music/services/progress.service');
  const { ensureJobsRegistered } = require('../recommendation-music/services/listenEvent.service');
  const { UserMusicProgress, UserMusicAffinity, ListenEvent } =
    require('../recommendation-music/models');
  const { musicRecommendationQueue } = require('../recommendation-music/jobs/musicQueue');
  require('../recommendation-music/jobs');

  ensureJobsRegistered();

  const album = await Album.findOne({
    categoryNameMusic: { $exists: true, $ne: '' },
    'songs.0': { $exists: true },
  }).lean();

  if (!album) {
    console.log('SKIP no album with songs');
    await mongoose.disconnect();
    process.exit(0);
  }

  const userId = new mongoose.Types.ObjectId();
  let fail = 0;
  const ok = (n, c, e = '') => {
    if (!c) {
      fail += 1;
      console.error('FAIL', n, e);
    } else console.log('ok', n, e);
  };

  console.log(`album id=${album.id} songs=${album.songs?.length || 0}`);

  // Trek 1: 5 daqiqa (300s), duration 5 min
  let r = await reportMusicProgress(userId, {
    contentType: 'album',
    contentId: album.id,
    category: album.categoryNameMusic,
    trackId: album.songs[0]?.id ?? 1,
    trackListenedSeconds: 300,
    listenedSeconds: 300,
    durationSec: 300,
    albumDurationSec: 1380, // 23 daqiqa
  });
  ok('trek1 5min accepted', r.ignored !== true, JSON.stringify({ aq: r.affinityQueued, first: r.firstMark }));

  for (let i = 0; i < 25; i += 1) {
    await musicRecommendationQueue.drain();
    await new Promise((res) => setTimeout(res, 80));
  }

  let prog = await UserMusicProgress.findOne({
    userId,
    contentKey: `album:${album.id}`,
  }).lean();
  ok('after trek1 total ~300s', prog && Math.abs(prog.listenedSeconds - 300) < 1, `sec=${prog?.listenedSeconds}`);
  ok('ContentView album after first 10s+', Boolean(await ContentView.findOne({ userId, type: 'album', itemId: String(album.id) })));

  // Trek 2: 9 daqiqa (540s) — jami 14 daqiqa
  const song2 = album.songs[1]?.id ?? album.songs[0]?.id ?? 2;
  r = await reportMusicProgress(userId, {
    contentType: 'album',
    contentId: album.id,
    category: album.categoryNameMusic,
    trackId: song2,
    trackListenedSeconds: 540,
    listenedSeconds: 540,
    durationSec: 540,
    albumDurationSec: 1380,
  });
  ok('trek2 9min accepted', r.ignored !== true);

  for (let i = 0; i < 25; i += 1) {
    await musicRecommendationQueue.drain();
    await new Promise((res) => setTimeout(res, 80));
  }

  prog = await UserMusicProgress.findOne({
    userId,
    contentKey: `album:${album.id}`,
  }).lean();

  const expected =
    song2 === (album.songs[0]?.id ?? 1)
      ? 540 // same track id → max only
      : 300 + 540; // 840s = 14 min

  ok(
    `album total listened ~${expected}s (14min if 2 tracks)`,
    prog && Math.abs(prog.listenedSeconds - expected) < 1,
    `sec=${prog?.listenedSeconds} completion=${prog?.completionRate}`
  );
  ok(
    'completionRate uses albumDurationSec 1380',
    prog && prog.albumDurationSec === 1380 && Math.abs(prog.completionRate - expected / 1380) < 0.01,
    `dur=${prog?.albumDurationSec} rate=${prog?.completionRate}`
  );

  const trackSeconds = prog?.trackSeconds
    ? prog.trackSeconds instanceof Map
      ? Object.fromEntries(prog.trackSeconds)
      : prog.trackSeconds
    : {};
  ok('trackSeconds map stored', Object.keys(trackSeconds).length >= 1, JSON.stringify(trackSeconds));

  await Promise.all([
    ContentView.deleteMany({ userId }),
    UserMusicProgress.deleteMany({ userId }),
    UserMusicAffinity.deleteMany({ userId }),
    ListenEvent.deleteMany({ userId }),
  ]);
  await mongoose.disconnect();

  if (fail) {
    console.error(`\n${fail} FAIL\n`);
    process.exit(1);
  }
  console.log('\nALL OK — album cumulative minutes\n');
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
