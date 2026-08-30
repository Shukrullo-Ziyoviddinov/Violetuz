require('dotenv').config();

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const exec = promisify(execFile);
const connectDB = require('../config/db');
const Music = require('../models/Music.model');
const fingerprintService = require('../services/fingerprint/fingerprint.service');
const { fingerprintFromBuffer } = require('../services/fingerprint/fpcalcRunner');

const mp3 = path.join(__dirname, '..', '..', 'my-movie', 'build', 'music', 'Zivert - Life.mp3');

const main = async () => {
  await connectDB();

  const total = await Music.countDocuments({ audio: { $ne: '' } });
  const raw = await Music.countDocuments({ fingerprint: { $regex: /^\[/ } });
  const legacy = await Music.countDocuments({
    fingerprint: { $exists: true, $ne: '', $not: /^\[/ },
  });

  console.log('--- DB ---');
  console.log('tracks with audio:', total);
  console.log('raw fingerprints [..]:', raw);
  console.log('legacy AQAD...:', legacy);

  if (!fs.existsSync(mp3)) {
    console.log('mp3 missing, skip identify test');
    process.exit(0);
  }

  const wav = path.join(os.tmpdir(), 'violet-identify-test.wav');
  await exec('ffmpeg', ['-y', '-i', mp3, '-t', '10', '-ar', '44100', '-ac', '1', '-f', 'wav', wav]);
  const buf = fs.readFileSync(wav);

  console.log('\n--- identifyFromAudioBuffer (10s wav as webm upload) ---');
  try {
    const result = await fingerprintService.identifyFromAudioBuffer(buf, 'sample.webm');
    console.log('queryDuration:', result.queryDuration);
    console.log('bestScore:', result.bestScore);
    console.log('matches:', result.matches.length);
    result.matches.slice(0, 5).forEach((m) => {
      console.log(`  id=${m.id} score=${m.score} ${m.title}`);
    });
  } catch (err) {
    console.error('identify FAILED:', err.message);
  }

  console.log('\n--- fingerprintFromBuffer only ---');
  try {
    const fp = await fingerprintFromBuffer(buf, 'sample.webm');
    console.log('fp duration:', fp.duration, 'fp starts:', fp.fingerprint.slice(0, 40));
  } catch (err) {
    console.error('fpcalc buffer FAILED:', err.message);
  }

  await fs.promises.unlink(wav).catch(() => {});
  process.exit(0);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
