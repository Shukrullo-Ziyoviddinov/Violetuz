'use strict';

require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await require('../config/db')();
  const Music = require('../models/Music.model');
  const Clip = require('../models/Clip.model');
  const Album = require('../models/Album.model');
  const ContentView = require('../models/ContentView.model');
  const { reportMusicProgress } = require('../recommendation-music/services/progress.service');
  const { ensureJobsRegistered } = require('../recommendation-music/services/listenEvent.service');
  const {
    UserMusicProgress,
    ListenEvent,
    UserMusicAffinity,
  } = require('../recommendation-music/models');
  const { musicRecommendationQueue } = require('../recommendation-music/jobs/musicQueue');
  require('../recommendation-music/jobs');

  ensureJobsRegistered();

  const userId = new mongoose.Types.ObjectId();
  let fail = 0;
  const ok = (n, c, e = '') => {
    if (!c) {
      fail += 1;
      console.error('FAIL', n, e);
    } else {
      console.log('ok', n, e);
    }
  };

  const track = await Music.findOne({
    categoryNameMusic: { $exists: true, $ne: '' },
  }).lean();
  const clip = await Clip.findOne({
    categoryNameMusic: { $exists: true, $ne: '' },
  }).lean();
  const album = await Album.findOne({
    categoryNameMusic: { $exists: true, $ne: '' },
  }).lean();

  if (!track) {
    console.log('SKIP no music');
    await mongoose.disconnect();
    process.exit(0);
  }

  let r = await reportMusicProgress(userId, {
    contentType: 'music',
    contentId: track.id,
    category: track.categoryNameMusic,
    listenedSeconds: 7,
    durationSec: 200,
  });
  ok('music 7s ignored', r.ignored === true);

  r = await reportMusicProgress(userId, {
    contentType: 'music',
    contentId: track.id,
    category: track.categoryNameMusic,
    listenedSeconds: 12,
    durationSec: 200,
    completionRate: 0.1,
  });
  ok(
    'music 12s accepted',
    r.ignored !== true && r.affinityQueued,
    JSON.stringify({ ignored: r.ignored, aq: r.affinityQueued, first: r.firstMark })
  );

  for (let i = 0; i < 30; i += 1) {
    await musicRecommendationQueue.drain();
    await new Promise((res) => setTimeout(res, 100));
  }

  const cvMusic = await ContentView.findOne({
    userId,
    type: 'music',
    itemId: String(track.id),
  }).lean();
  ok('ContentView music written', Boolean(cvMusic));

  const prog = await UserMusicProgress.findOne({
    userId,
    contentKey: `music:${track.id}`,
  }).lean();
  ok(
    'UserMusicProgress written',
    Boolean(prog) && prog.listenedSeconds >= 12,
    prog ? `sec=${prog.listenedSeconds}` : ''
  );

  const ev = await ListenEvent.findOne({
    userId,
    contentKey: `music:${track.id}`,
  }).lean();
  ok('ListenEvent written', Boolean(ev));

  const aff = await UserMusicAffinity.countDocuments({
    userId,
    category: track.categoryNameMusic,
  });
  ok('affinity cells after music', aff > 0, `n=${aff}`);

  if (clip) {
    r = await reportMusicProgress(userId, {
      contentType: 'clip',
      contentId: clip.id,
      category: clip.categoryNameMusic,
      listenedSeconds: 15,
      durationSec: 120,
      completionRate: 0.2,
    });
    ok('clip 15s accepted', r.ignored !== true && (r.affinityQueued || r.updated));

    for (let i = 0; i < 30; i += 1) {
      await musicRecommendationQueue.drain();
      await new Promise((res) => setTimeout(res, 100));
    }

    const cvClip = await ContentView.findOne({
      userId,
      type: 'klip',
      itemId: String(clip.id),
    }).lean();
    ok('ContentView clip type=klip', Boolean(cvClip));

    const wrong = await ContentView.findOne({
      userId,
      type: 'music',
      itemId: String(clip.id),
    }).lean();
    ok('clip not marked as music', !wrong);
  } else {
    console.log('SKIP clip');
  }

  if (album) {
    r = await reportMusicProgress(userId, {
      contentType: 'album',
      contentId: album.id,
      category: album.categoryNameMusic,
      listenedSeconds: 12,
      durationSec: 200,
    });
    ok('album progress accepted', r.ignored !== true);

    for (let i = 0; i < 20; i += 1) {
      await musicRecommendationQueue.drain();
      await new Promise((res) => setTimeout(res, 80));
    }

    const cvAlbum = await ContentView.findOne({
      userId,
      type: 'album',
      itemId: String(album.id),
    }).lean();
    ok('ContentView album written (album id, not song)', Boolean(cvAlbum));

    // Song-id bilan album ContentView bo‘lmasligi kerak
    const wrongSongAsAlbum = await ContentView.findOne({
      userId,
      type: 'album',
      itemId: { $ne: String(album.id) },
    }).lean();
    ok('no stray album ContentView for other ids', !wrongSongAsAlbum);
  }

  await Promise.all([
    ContentView.deleteMany({ userId }),
    UserMusicProgress.deleteMany({ userId }),
    ListenEvent.deleteMany({ userId }),
    UserMusicAffinity.deleteMany({ userId }),
  ]);
  await mongoose.disconnect();

  if (fail) {
    console.error(`\n${fail} FAIL\n`);
    process.exit(1);
  }
  console.log('\nALL OK — tinglandi/ko‘rildi yozilishi to‘g‘ri\n');
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
