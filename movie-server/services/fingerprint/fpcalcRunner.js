const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs/promises');

const execFileAsync = promisify(execFile);

const FPCALC_BIN = process.env.FPCALC_PATH || 'fpcalc';
const FFMPEG_BIN = process.env.FFMPEG_PATH || 'ffmpeg';

const runFpcalc = async (filePath, { length } = {}) => {
  const args = ['-json', '-raw'];
  if (length != null && Number.isFinite(length)) {
    args.push('-length', String(length));
  }
  args.push(filePath);

  const { stdout } = await execFileAsync(FPCALC_BIN, args, {
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
  });

  const parsed = JSON.parse(stdout);
  if (!Array.isArray(parsed?.fingerprint) || !parsed.fingerprint.length) {
    throw new Error('fpcalc returned empty fingerprint');
  }

  return {
    duration: Number(parsed.duration) || 0,
    fingerprint: JSON.stringify(parsed.fingerprint),
  };
};

const convertToWav = async (inputPath, outputPath) => {
  await execFileAsync(
    FFMPEG_BIN,
    ['-y', '-i', inputPath, '-ar', '44100', '-ac', '1', '-f', 'wav', outputPath],
    { timeout: 120_000, maxBuffer: 8 * 1024 * 1024 }
  );
};

const fingerprintFromFile = async (filePath, options = {}) => {
  return runFpcalc(filePath, options);
};

/**
 * Browser upload (webm/ogg) → temp wav → fingerprint.
 */
const fingerprintFromBuffer = async (buffer, originalName = 'sample.webm') => {
  const os = require('os');
  const path = require('path');
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'violet-fp-'));
  const inputPath = path.join(tmpDir, originalName.replace(/[^\w.-]/g, '_'));
  const wavPath = path.join(tmpDir, 'sample.wav');

  try {
    await fs.writeFile(inputPath, buffer);
    await convertToWav(inputPath, wavPath);
    return await runFpcalc(wavPath, { length: 120 });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
};

const checkFingerprintTools = async () => {
  try {
    await execFileAsync(FPCALC_BIN, ['-version'], { timeout: 10_000 });
    await execFileAsync(FFMPEG_BIN, ['-version'], { timeout: 10_000 });
    return { fpcalc: true, ffmpeg: true };
  } catch {
    return { fpcalc: false, ffmpeg: false };
  }
};

module.exports = {
  fingerprintFromFile,
  fingerprintFromBuffer,
  checkFingerprintTools,
};
