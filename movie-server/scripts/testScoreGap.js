require('dotenv').config();
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const exec = promisify(execFile);
const connectDB = require('../config/db');
const Music = require('../models/Music.model');
const { compareFingerprintStrings } = require('../utils/chromaprintCompare');
const { fingerprintFromBuffer } = require('../services/fingerprint/fpcalcRunner');

const mp3 = path.join(__dirname, '..', '..', 'my-movie', 'build', 'music', 'Zivert - Life.mp3');

const scoreGap = async (label, ffmpegArgs) => {
  const out = path.join(os.tmpdir(), `gap-${label}.webm`);
  await exec('ffmpeg', ['-y', ...ffmpegArgs, out]);
  const q = await fingerprintFromBuffer(fs.readFileSync(out), 'sample.webm');
  const catalog = await Music.find({ fingerprint: { $regex: /^\[/ } })
    .select({ title: 1, fingerprint: 1 })
    .lean();

  const seen = new Set();
  const scored = [];
  for (const t of catalog) {
    if (seen.has(t.fingerprint)) continue;
    seen.add(t.fingerprint);
    scored.push({
      title: t.title,
      score: compareFingerprintStrings(q.fingerprint, t.fingerprint),
    });
  }
  scored.sort((a, b) => b.score - a.score);
  const gap = scored[0].score - (scored[1]?.score ?? 0);
  console.log(
    `${label}: best=${scored[0].score.toFixed(3)} 2nd=${scored[1]?.score.toFixed(3)} gap=${gap.toFixed(3)} title=${scored[0].title}`
  );
};

const main = async () => {
  await connectDB();
  await scoreGap('same-phone', [
    '-i',
    mp3,
    '-t',
    '10',
    '-af',
    'volume=0.05,highpass=f=500,lowpass=f=2800',
    '-c:a',
    'libopus',
    '-b:a',
    '24k',
  ]);
  await scoreGap('noise', [
    '-f',
    'lavfi',
    '-i',
    'anoisesrc=color=white:amplitude=0.05:sample_rate=44100',
    '-t',
    '10',
    '-c:a',
    'libopus',
  ]);
  await scoreGap('real', ['-i', mp3, '-t', '10', '-c:a', 'libopus']);
};

main().catch(console.error);
