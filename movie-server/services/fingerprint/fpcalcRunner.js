const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs/promises');

const execFileAsync = promisify(execFile);

const FPCALC_BIN = process.env.FPCALC_PATH || 'fpcalc';
const FFMPEG_BIN = process.env.FFMPEG_PATH || 'ffmpeg';

const UPLOAD_FILTER_PRESETS = [
  'dynaudnorm=f=75:g=15',
  'highpass=f=180,lowpass=f=4200,dynaudnorm=f=75:g=15',
  'highpass=f=280,lowpass=f=3400,volume=2.5,dynaudnorm=f=75:g=15',
];

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

const convertToWav = async (inputPath, outputPath, { audioFilter } = {}) => {
  const args = ['-y', '-i', inputPath, '-ar', '44100', '-ac', '1'];
  if (audioFilter) args.push('-af', audioFilter);
  args.push('-f', 'wav', outputPath);

  await execFileAsync(FFMPEG_BIN, args, {
    timeout: 120_000,
    maxBuffer: 8 * 1024 * 1024,
  });
};

const fingerprintFromFile = async (filePath, options = {}) => {
  return runFpcalc(filePath, options);
};

/**
 * Browser upload → bir nechta audio filter bilan fingerprint (telefon mikrofoni uchun).
 */
const fingerprintFromBufferMulti = async (buffer, originalName = 'sample.webm') => {
  const os = require('os');
  const path = require('path');
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'violet-fp-'));
  const inputPath = path.join(tmpDir, originalName.replace(/[^\w.-]/g, '_'));

  try {
    await fs.writeFile(inputPath, buffer);

    const results = [];
    for (let i = 0; i < UPLOAD_FILTER_PRESETS.length; i += 1) {
      const wavPath = path.join(tmpDir, `sample-${i}.wav`);
      await convertToWav(inputPath, wavPath, { audioFilter: UPLOAD_FILTER_PRESETS[i] });
      const fp = await runFpcalc(wavPath);
      results.push(fp);
    }

    return results;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
};

const fingerprintFromBuffer = async (buffer, originalName = 'sample.webm') => {
  const results = await fingerprintFromBufferMulti(buffer, originalName);
  return results[0];
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
  fingerprintFromBufferMulti,
  checkFingerprintTools,
};
