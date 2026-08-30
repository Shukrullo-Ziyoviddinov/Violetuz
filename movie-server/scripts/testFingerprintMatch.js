const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const exec = promisify(execFile);
const { fingerprintFromFile, fingerprintFromBuffer } = require('../services/fingerprint/fpcalcRunner');
const { compareFingerprintStrings, decodeFingerprint } = require('../utils/chromaprintCompare');

const mp3 = path.join(__dirname, '..', '..', 'my-movie', 'build', 'music', 'Zivert - Life.mp3');

const main = async () => {
  if (!fs.existsSync(mp3)) {
    console.error('MP3 not found:', mp3);
    process.exit(1);
  }

  const full = await fingerprintFromFile(mp3);
  const fullDecoded = decodeFingerprint(full.fingerprint);
  console.log('full duration:', full.duration);
  console.log('full fingerprint decoded length:', fullDecoded.length);

  const wav = path.join(os.tmpdir(), 'violet-test-clip.wav');
  await exec('ffmpeg', ['-y', '-i', mp3, '-t', '10', '-ar', '44100', '-ac', '1', '-f', 'wav', wav]);

  const clip = await fingerprintFromFile(wav);
  const clipDecoded = decodeFingerprint(clip.fingerprint);
  console.log('clip decoded length:', clipDecoded.length);

  const scoreClip = compareFingerprintStrings(clip.fingerprint, full.fingerprint);
  console.log('10s clip vs full score:', scoreClip);

  const buf = fs.readFileSync(wav);
  const fromBuf = await fingerprintFromBuffer(buf, 'sample.webm');
  const scoreBuf = compareFingerprintStrings(fromBuf.fingerprint, full.fingerprint);
  console.log('buffer(webm path) vs full score:', scoreBuf);

  await fs.promises.unlink(wav).catch(() => {});
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
