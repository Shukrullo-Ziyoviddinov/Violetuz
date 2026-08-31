require('dotenv').config();

const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const exec = promisify(execFile);
const connectDB = require('../config/db');
const fingerprintService = require('../services/fingerprint/fingerprint.service');

const makeSilence = async (out, sec = 8) => {
  await exec('ffmpeg', ['-y', '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono`, '-t', String(sec), out]);
};

const makeNoise = async (out, sec = 8) => {
  await exec('ffmpeg', [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `anoisesrc=color=white:amplitude=0.05:sample_rate=44100`,
    '-t',
    String(sec),
    out,
  ]);
};

const testBuffer = async (label, buf) => {
  const result = await fingerprintService.identifyFromAudioBuffer(buf, 'sample.webm');
  console.log(`\n[${label}]`);
  console.log('  bestScore:', result.bestScore);
  console.log('  matches:', result.matches.length);
  if (result.matches[0]) {
    console.log('  top:', result.matches[0].title, result.matches[0].score);
  }
  if (result.matches[1]) {
    console.log('  2nd:', result.matches[1].title, result.matches[1].score);
  }
};

const main = async () => {
  await connectDB();
  const tmp = os.tmpdir();

  const silence = path.join(tmp, 'violet-silence.wav');
  const noise = path.join(tmp, 'violet-noise.wav');
  const music = path.join(
    __dirname,
    '..',
    '..',
    'my-movie',
    'build',
    'music',
    'Zivert - Life.mp3'
  );

  await makeSilence(silence);
  await makeNoise(noise);

  await testBuffer('SILENCE', await fs.readFile(silence));
  await testBuffer('NOISE', await fs.readFile(noise));

  const webm = path.join(tmp, 'violet-music.webm');
  await exec('ffmpeg', ['-y', '-i', music, '-t', '8', '-c:a', 'libopus', webm]);
  await testBuffer('MUSIC (Zivert Life)', await fs.readFile(webm));

  await fs.unlink(silence).catch(() => {});
  await fs.unlink(noise).catch(() => {});
  await fs.unlink(webm).catch(() => {});
  process.exit(0);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
