const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const exec = promisify(execFile);
const { fingerprintFromBuffer } = require('../services/fingerprint/fpcalcRunner');
const fingerprintService = require('../services/fingerprint/fingerprint.service');
const connectDB = require('../config/db');

const mp3 = path.join(__dirname, '..', '..', 'my-movie', 'build', 'music', 'Zivert - Life.mp3');

const main = async () => {
  const webm = path.join(os.tmpdir(), 'violet-webm-test.webm');
  await exec('ffmpeg', ['-y', '-i', mp3, '-t', '8', '-c:a', 'libopus', '-b:a', '96k', webm]);
  const buf = await fs.readFile(webm);

  console.log('webm size:', buf.length);
  const fp = await fingerprintFromBuffer(buf, 'sample.webm');
  console.log('fingerprint duration:', fp.duration);

  await connectDB();
  const result = await fingerprintService.identifyFromAudioBuffer(buf, 'sample.webm');
  console.log('matches:', result.matches.length, 'best:', result.bestScore);
  result.matches.slice(0, 3).forEach((m) => console.log(`  ${m.id} ${m.title} ${m.score}`));

  await fs.unlink(webm).catch(() => {});
};

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
