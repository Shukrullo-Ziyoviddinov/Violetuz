/**
 * Tarona diagnose — barcha unique mp3 lar va filter presetlar bo'yicha.
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
const fingerprintService = require('../services/fingerprint/fingerprint.service');
const { fingerprintFromBufferMulti } = require('../services/fingerprint/fpcalcRunner');
const { compareFingerprintStrings } = require('../utils/chromaprintCompare');

const simulatePhone = async (inputPath, outPath) => {
  await exec('ffmpeg', [
    '-y',
    '-i',
    inputPath,
    '-t',
    '10',
    '-af',
    'volume=0.12,highpass=f=350,lowpass=f=3200',
    '-c:a',
    'libopus',
    '-b:a',
    '32k',
    outPath,
  ]);
};

const main = async () => {
  await connectDB();

  const catalog = await Music.find({
    fingerprint: { $exists: true, $ne: '', $regex: /^\[/ },
  })
    .select({ id: 1, title: 1, audio: 1, fingerprint: 1, fingerprintWindows: 1 })
    .lean();

  const byAudio = new Map();
  for (const t of catalog) {
    const key = String(t.audio || '');
    if (!key || byAudio.has(key)) continue;
    byAudio.set(key, t);
  }

  console.log('--- DB ---');
  console.log('total tracks:', catalog.length);
  console.log('unique audio files:', byAudio.size);
  console.log(
    'thresholds:',
    'MATCH=',
    fingerprintService.MATCH_THRESHOLD,
    'GAP=',
    fingerprintService.MIN_SCORE_GAP
  );

  const localDir = path.join(__dirname, '..', '..', 'my-movie', 'build', 'music');
  const tmp = os.tmpdir();

  console.log('\n--- Per unique track (phone sim 10s) ---\n');

  for (const [audioKey, track] of byAudio) {
    const base = path.basename(audioKey);
    const local = path.join(localDir, base);
    let input = local;

    try {
      await fs.access(local);
    } catch {
      console.log(`SKIP ${base} — lokal fayl yo'q`);
      continue;
    }

    const webm = path.join(tmp, `diag-${track.id}.webm`);
    await simulatePhone(input, webm);
    const buf = await fs.readFile(webm);

    const result = await fingerprintService.identifyFromAudioBuffer(buf, 'sample.webm');
    const ok = result.matches.some((m) => String(m.title).toLowerCase().includes(String(track.title).toLowerCase().slice(0, 8)))
      || result.matches[0]?.id === track.id;

    console.log(
      `${ok ? 'OK' : 'FAIL'} | ${track.title} | score=${result.bestScore} | vol=${result.meanVolumeDb} | dur=${result.queryDuration} | reason=${result.rejectedReason || '-'} | top=${result.matches[0]?.title || '-'} (${result.matches[0]?.score || 0})`
    );

    const filters = await fingerprintFromBufferMulti(buf, 'sample.webm');
    const scores = filters.map((fp, i) => {
      let best = 0;
      for (const win of track.fingerprintWindows || []) {
        if (win?.fingerprint) best = Math.max(best, compareFingerprintStrings(fp.fingerprint, win.fingerprint));
      }
      best = Math.max(best, compareFingerprintStrings(fp.fingerprint, track.fingerprint));
      return `f${i}=${best.toFixed(3)}`;
    });
    console.log(`     filter scores vs catalog: ${scores.join(' ')}`);

    await fs.unlink(webm).catch(() => {});
  }

  process.exit(0);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
