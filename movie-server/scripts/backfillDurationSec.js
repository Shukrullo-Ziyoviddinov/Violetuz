require('dotenv').config();

const connectDB = require('../config/db');
const Music = require('../models/Music.model');
const {
  buildAudioDurationMap,
  propagateDurationByAudio,
  normalizeDurationSec,
} = require('../services/fingerprint/musicDuration');

/**
 * Mavjud treklarga durationSec yozish (fpcalc kerak emas).
 * fingerprintDuration → durationSec va bir xil audio bo'yicha tarqatish.
 */
const main = async () => {
  await connectDB();

  const tracks = await Music.find({ audio: { $ne: '' } })
    .select({ id: 1, audio: 1, title: 1, durationSec: 1, fingerprintDuration: 1 })
    .lean();

  const durationByAudio = buildAudioDurationMap(tracks);
  let propagated = 0;
  let missing = 0;

  for (const [audioKey, sec] of durationByAudio) {
    const { modified } = await propagateDurationByAudio(Music, audioKey, sec);
    propagated += modified;
  }

  for (const track of tracks) {
    const resolved = normalizeDurationSec(track.durationSec) ?? durationByAudio.get(String(track.audio || '').trim());
    if (resolved == null) {
      missing += 1;
      // eslint-disable-next-line no-console
      console.warn(`[duration] missing id=${track.id} ${track.title || ''}`);
    }
  }

  console.log('\n--- Duration backfill ---');
  console.log(`Tracks scanned: ${tracks.length}`);
  console.log(`Unique audio files: ${durationByAudio.size}`);
  console.log(`Documents updated: ${propagated}`);
  console.log(`Still missing duration: ${missing}`);

  process.exit(missing > 0 ? 1 : 0);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
