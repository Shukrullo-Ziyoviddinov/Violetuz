/**
 * Har bir haqiqiy mp3 uchun phone-sim identify (to'g'ri fayl nomi bilan).
 */
require('dotenv').config();

const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const https = require('https');
const http = require('http');

const exec = promisify(execFile);
const connectDB = require('../config/db');
const fingerprintService = require('../services/fingerprint/fingerprint.service');
const { resolveMediaUrl, resolveLocalMediaPath } = require('../utils/resolveMediaUrl');

const AUDIO_FILES = [
  '/music/Official Arctic Monkeys - I Wanna Be Yours.mp3',
  '/music/Reed Wonder - When I Dream Of You.mp3',
  '/music/Zivert - Life.mp3',
  '/music/Chris Grey - WRONG (Official Lyric Video).mp3',
];

const download = (url, dest) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => fs.writeFile(dest, Buffer.concat(chunks)).then(resolve).catch(reject));
    });
    req.on('error', reject);
  });

const simulatePhone = async (input, out) => {
  await exec('ffmpeg', [
    '-y',
    '-i',
    input,
    '-t',
    '10',
    '-af',
    'volume=0.12,highpass=f=350,lowpass=f=3200',
    '-c:a',
    'libopus',
    '-b:a',
    '32k',
    out,
  ]);
};

const main = async () => {
  await connectDB();
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'violet-audit-'));

  console.log('MATCH_THRESHOLD', fingerprintService.MATCH_THRESHOLD);
  console.log('');

  for (const audio of AUDIO_FILES) {
    const name = path.basename(audio);
    let input = resolveLocalMediaPath(audio);
    if (!input) {
      const url = resolveMediaUrl(audio);
      input = path.join(tmp, name);
      try {
        await download(url, input);
      } catch (e) {
        console.log(`SKIP ${name}: ${e.message}`);
        continue;
      }
    }

    const webm = path.join(tmp, `${name}.webm`);
    await simulatePhone(input, webm);
    const buf = await fs.readFile(webm);
    const r = await fingerprintService.identifyFromAudioBuffer(buf, 'sample.webm');
    const top = r.matches[0];
    const expected = name.replace(/\.mp3$/i, '').slice(0, 12).toLowerCase();
    const got = String(top?.title || '').toLowerCase();
    const ok =
      r.matches.length > 0 &&
      (got.includes('life') && name.includes('Zivert')) ||
      (got.includes('wrong') && name.includes('Chris')) ||
      (got.includes('wanna') || got.includes('arctic') || got.includes('cho')) && name.includes('Arctic') ||
      (got.includes('dream') || got.includes('reed') || got.includes('smooth')) && name.includes('Reed');

    console.log(
      `${r.matches.length ? (ok ? 'OK' : 'WRONG') : 'FAIL'} | ${name}`
    );
    console.log(
      `  score=${r.bestScore} gap=${r.scoreGap ?? '?'} vol=${r.meanVolumeDb} dur=${r.queryDuration} reason=${r.rejectedReason || '-'}`
    );
    console.log(`  top: ${top?.title || '-'} (${top?.score || 0})`);
  }

  await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
  process.exit(0);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
