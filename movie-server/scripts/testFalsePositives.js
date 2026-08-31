/**
 * DEV ONLY — Tarona identify ni lokal tekshirish.
 * Bu skript production/Tarona ga ta'sir qilmaydi.
 *
 * Haqiqiy oqim:
 *   telefon mikrofoni → API POST /identify/music → MongoDB dagi fingerprintlar bilan solishtirish
 *
 * Bu yerda Zivert - Life.mp3 faqat kompyuterdagi test fayl (build/music da bor).
 * Real ilovada ma'lumot MongoDB dan keladi.
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
const { resolveLocalMediaPath } = require('../utils/resolveMediaUrl');

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
  console.log('  meanVolumeDb:', result.meanVolumeDb);
  console.log('  bestScore:', result.bestScore);
  console.log('  rejectedReason:', result.rejectedReason || '-');
  console.log('  matches:', result.matches.length);
  if (result.matches[0]) {
    console.log('  top:', result.matches[0].title, `(id=${result.matches[0].id})`, result.matches[0].score);
  }
};

const resolveTestMusicFile = async () => {
  const track = await Music.findOne({ audio: { $regex: /\.mp3$/i } })
    .select({ id: 1, title: 1, audio: 1 })
    .lean();

  if (!track?.audio) {
    throw new Error('DB da test uchun mp3 topilmadi');
  }

  const local = resolveLocalMediaPath(track.audio);
  if (!local) {
    throw new Error(`DB trek topildi (id=${track.id} ${track.title}), lekin lokal fayl yo'q: ${track.audio}`);
  }

  console.log(`Test trek (DB): id=${track.id} "${track.title}" → ${track.audio}`);
  return local;
};

const main = async () => {
  await connectDB();
  const tmp = os.tmpdir();

  const silence = path.join(tmp, 'violet-silence.wav');
  const noise = path.join(tmp, 'violet-noise.wav');
  const music = await resolveTestMusicFile();

  await makeSilence(silence);
  await makeNoise(noise);

  await testBuffer('SILENCE', await fs.readFile(silence));
  await testBuffer('NOISE', await fs.readFile(noise));

  const webm = path.join(tmp, 'violet-music.webm');
  await exec('ffmpeg', ['-y', '-i', music, '-t', '8', '-c:a', 'libopus', webm]);
  await testBuffer('MUSIC (from DB track)', await fs.readFile(webm));

  await fs.unlink(silence).catch(() => {});
  await fs.unlink(noise).catch(() => {});
  await fs.unlink(webm).catch(() => {});
  process.exit(0);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
