const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const execFileAsync = promisify(execFile);
const FFMPEG_BIN = process.env.FFMPEG_PATH || 'ffmpeg';

/** mean_volume shundan past bo'lsa — jim/shovqinsiz deb hisoblanadi (sukunat ~-91 dB) */
const MIN_MEAN_VOLUME_DB =
  Number(process.env.FINGERPRINT_MIN_MEAN_VOLUME_DB) || -48;

const parseMeanVolume = (stderr) => {
  const match = String(stderr).match(/mean_volume:\s*([-\d.]+)\s*dB/);
  return match ? Number(match[1]) : null;
};

/**
 * Upload buffer → ffmpeg volumedetect → mean_volume dB.
 */
const measureAudioLevelDb = async (buffer, originalName = 'sample.webm') => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'violet-vol-'));
  const inputPath = path.join(tmpDir, originalName.replace(/[^\w.-]/g, '_'));

  try {
    await fs.writeFile(inputPath, buffer);
    const { stderr } = await execFileAsync(
      FFMPEG_BIN,
      ['-hide_banner', '-i', inputPath, '-af', 'volumedetect', '-f', 'null', '-'],
      { timeout: 60_000, maxBuffer: 2 * 1024 * 1024 }
    );
    return parseMeanVolume(stderr);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
};

const isAudioLevelSufficient = (meanVolumeDb) => {
  if (meanVolumeDb == null || Number.isNaN(meanVolumeDb)) return true;
  return meanVolumeDb >= MIN_MEAN_VOLUME_DB;
};

module.exports = {
  MIN_MEAN_VOLUME_DB,
  measureAudioLevelDb,
  isAudioLevelSufficient,
};
