require('dotenv').config();
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const exec = promisify(execFile);
const connectDB = require('../config/db');
const fp = require('../services/fingerprint/fingerprint.service');

const mp3 = path.join(__dirname, '..', '..', 'my-movie', 'build', 'music', 'Zivert - Life.mp3');

const run = async (label, args) => {
  const out = path.join(os.tmpdir(), `worst-${label}.webm`);
  await exec('ffmpeg', ['-y', '-i', mp3, '-t', '10', ...args, out]);
  const r = await fp.identifyFromAudioBuffer(fs.readFileSync(out), 'sample.webm');
  console.log(`${label}: vol=${r.meanVolumeDb} score=${r.bestScore} n=${r.matches.length} reason=${r.rejectedReason || '-'}`);
};

const main = async () => {
  await connectDB();
  await run('worst1', ['-af', 'volume=0.03,highpass=f=600,lowpass=f=2400', '-c:a', 'libopus', '-b:a', '16k']);
  await run('worst2', ['-af', 'volume=0.02,highpass=f=700,lowpass=f=2200', '-c:a', 'libopus', '-b:a', '16k']);
  await run('short6s', ['-t', '6', '-c:a', 'libopus']);
  await run('short4s', ['-t', '4', '-c:a', 'libopus']);
};

main().catch(console.error);
