require('dotenv').config();

const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const exec = promisify(execFile);
const connectDB = require('../config/db');
const fingerprintService = require('../services/fingerprint/fingerprint.service');

const mp3 = path.join(__dirname, '..', '..', 'my-movie', 'build', 'music', 'Zivert - Life.mp3');

const runCase = async (label, ffmpegArgs) => {
  const out = path.join(os.tmpdir(), `stab-${label.replace(/\s/g, '')}.webm`);
  await exec('ffmpeg', ['-y', '-i', mp3, '-t', '10', ...ffmpegArgs, out]);
  const buf = await fs.readFile(out);
  const r = await fingerprintService.identifyFromAudioBuffer(buf, 'sample.webm');
  console.log(
    `${label.padEnd(22)} score=${String(r.bestScore).padEnd(5)} n=${r.matches.length} reason=${r.rejectedReason || '-'}`
  );
  await fs.unlink(out).catch(() => {});
};

const main = async () => {
  await connectDB();
  console.log('--- Barqarorlik testi (5 marta telefon sim) ---\n');

  for (let i = 1; i <= 5; i += 1) {
    await runCase(`phone-attempt-${i}`, [
      '-af',
      'volume=0.12,highpass=f=350,lowpass=f=3200',
      '-c:a',
      'libopus',
      '-b:a',
      '32k',
    ]);
  }

  console.log('\n--- Boshqa holatlar ---\n');
  await runCase('clean', ['-c:a', 'libopus']);
  await runCase('same-phone', ['-af', 'volume=0.05,highpass=f=500,lowpass=f=2800', '-c:a', 'libopus', '-b:a', '24k']);

  const silence = path.join(os.tmpdir(), 'stab-silence.wav');
  await exec('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '10', silence]);
  const sr = await fingerprintService.identifyFromAudioBuffer(await fs.readFile(silence), 'sample.webm');
  console.log(`${'silence'.padEnd(22)} score=${String(sr.bestScore).padEnd(5)} n=${sr.matches.length} reason=${sr.rejectedReason || '-'}`);
  await fs.unlink(silence).catch(() => {});

  process.exit(0);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
