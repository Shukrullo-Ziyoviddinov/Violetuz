require('dotenv').config();
const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const https = require('https');

const exec = promisify(execFile);
const connectDB = require('../config/db');
const Music = require('../models/Music.model');
const { resolveMediaUrl } = require('../utils/resolveMediaUrl');
const { fingerprintFromBufferMulti } = require('../services/fingerprint/fpcalcRunner');
const { compareFingerprintStrings } = require('../utils/chromaprintCompare');

const download = (url, dest) =>
  new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => fs.writeFile(dest, Buffer.concat(chunks)).then(resolve).catch(reject));
    }).on('error', reject);
  });

const scoreCatalog = async (queryFp, catalog) => {
  const groups = new Map();
  for (const t of catalog) {
    const key = t.audio;
    if (!groups.has(key)) groups.set(key, { fps: [], title: t.title });
    const g = groups.get(key);
    if (t.fingerprint?.startsWith('[')) g.fps.push(t.fingerprint);
    for (const w of t.fingerprintWindows || []) {
      if (w?.fingerprint?.startsWith('[')) g.fps.push(w.fingerprint);
    }
  }
  const scored = [];
  for (const [audio, g] of groups) {
    let best = 0;
    for (const fp of [...new Set(g.fps)]) {
      best = Math.max(best, compareFingerprintStrings(queryFp, fp));
    }
    scored.push({ audio: path.basename(audio), score: best });
  }
  scored.sort((a, b) => b.score - a.score);
  const gap = scored[0].score - (scored[1]?.score ?? 0);
  return { scored: scored.slice(0, 4), gap };
};

const main = async () => {
  await connectDB();
  const catalog = await Music.find({ fingerprint: /^\[/ }).select('audio fingerprint fingerprintWindows title').lean();
  const tmp = os.tmpdir();

  const tests = [
    { label: 'NOISE', cmd: ['-f', 'lavfi', '-i', 'anoisesrc=color=white:amplitude=0.05', '-t', '8'] },
    {
      label: 'ARCTIC_PHONE',
      file: '/music/Official Arctic Monkeys - I Wanna Be Yours.mp3',
      phone: true,
    },
    {
      label: 'CHRIS_PHONE',
      file: '/music/Chris Grey - WRONG (Official Lyric Video).mp3',
      phone: true,
    },
  ];

  for (const t of tests) {
    const webm = path.join(tmp, `${t.label}.webm`);
    if (t.cmd) {
      await exec('ffmpeg', ['-y', ...t.cmd, '-c:a', 'libopus', webm]);
    } else {
      const url = resolveMediaUrl(t.file);
      const mp3 = path.join(tmp, 'src.mp3');
      await download(url, mp3);
      const args = ['-y', '-i', mp3, '-t', '10'];
      if (t.phone) args.push('-af', 'volume=0.12,highpass=f=350,lowpass=f=3200', '-c:a', 'libopus', '-b:a', '32k');
      else args.push('-c:a', 'libopus');
      args.push(webm);
      await exec('ffmpeg', args);
    }
    const buf = await fs.readFile(webm);
    const filters = await fingerprintFromBufferMulti(buf, 'sample.webm');
    const fp = filters[0];
    const { scored, gap } = await scoreCatalog(fp.fingerprint, catalog);
    console.log(`\n${t.label}: best=${scored[0]?.score?.toFixed(3)} gap=${gap.toFixed(3)} top=${scored[0]?.audio}`);
    console.log('  ranks:', scored.map((s) => `${s.audio}=${s.score.toFixed(3)}`).join(' | '));
  }
  process.exit(0);
};

main().catch((e) => { console.error(e); process.exit(1); });
