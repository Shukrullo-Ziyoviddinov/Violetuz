/**
 * DEV ONLY — DB fingerprint sifati + intermittent match tahlili
 */
require('dotenv').config();

const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const exec = promisify(execFile);
const connectDB = require('../config/db');
const Music = require('../models/Music.model');
const { fingerprintFromBufferMulti } = require('../services/fingerprint/fpcalcRunner');
const { compareFingerprintStrings } = require('../utils/chromaprintCompare');
const fingerprintService = require('../services/fingerprint/fingerprint.service');

const MUSIC_DIR = path.join(__dirname, '..', '..', 'my-movie', 'build', 'music');
const FILES = [
  ['Arctic', 'Official Arctic Monkeys - I Wanna Be Yours.mp3'],
  ['Zivert', 'Zivert - Life.mp3'],
  ['Reed', 'Reed Wonder - When I Dream Of You.mp3'],
  ['Chris', 'Chris Grey - WRONG (Official Lyric Video).mp3'],
];

const main = async () => {
  await connectDB();

  const catalog = await Music.find({ fingerprint: { $regex: /^\[/ } })
    .select({ id: 1, title: 1, fingerprint: 1 })
    .lean();

  const groups = new Map();
  for (const t of catalog) {
    if (!groups.has(t.fingerprint)) groups.set(t.fingerprint, t.title);
  }
  console.log('catalog unique fps:', groups.size);
  console.log('MATCH_THRESHOLD:', fingerprintService.MATCH_THRESHOLD);

  for (const [label, name] of FILES) {
    const mp3 = path.join(MUSIC_DIR, name);
    const out = path.join(os.tmpdir(), `tarona-dbq-${label}.webm`);

    // 30-soniyadan boshlab, telefon mikrofoni simulyatsiyasi
    await exec('ffmpeg', [
      '-y',
      '-ss',
      '30',
      '-i',
      mp3,
      '-t',
      '8',
      '-af',
      'volume=0.1,highpass=f=300,lowpass=f=3500',
      '-c:a',
      'libopus',
      '-b:a',
      '24k',
      out,
    ]);

    const buf = await fs.readFile(out);
    const r = await fingerprintService.identifyFromAudioBuffer(buf, 'sample.webm');
    const fps = await fingerprintFromBufferMulti(buf, 'sample.webm');

    const scores = [];
    for (const [fp, title] of groups) {
      let best = 0;
      for (const q of fps) {
        best = Math.max(best, compareFingerprintStrings(q.fingerprint, fp));
      }
      scores.push({ title, score: Math.round(best * 1000) / 1000 });
    }
    scores.sort((a, b) => b.score - a.score);

    console.log(
      `\n${label} identify: score=${r.bestScore} n=${r.matches.length} reason=${r.rejectedReason || '-'} top=${r.matches[0]?.title || '-'}`
    );
    console.log(
      '  vs groups:',
      scores.map((s) => `${s.title.slice(0, 22)}=${s.score}`).join(' | ')
    );

    await fs.unlink(out).catch(() => {});
  }

  process.exit(0);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
