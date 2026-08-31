const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const execFileAsync = promisify(execFile);
const FFMPEG_BIN = process.env.FFMPEG_PATH || 'ffmpeg';

/** mean_volume shundan past — jim (sukunat ~-91 dB) */
const MIN_MEAN_VOLUME_DB =
  Number(process.env.FINGERPRINT_MIN_MEAN_VOLUME_DB) || -58;

/** volumedetect ishonchsiz (qisqa clip / haqiqiy sukunat) */
const UNRELIABLE_VOLUME_DB = -85;

const parseMeanVolume = (stderr) => {
  const match = String(stderr).match(/mean_volume:\s*([-\d.]+)\s*dB/);
  return match ? Number(match[1]) : null;
};

/**
 * @returns {{ status: 'ok'|'silent'|'unknown', db: number|null }}
 * - ok: o‘lchanishi mumkin bo‘lgan ovoz
 * - silent: ffmpeg ishladi, lekin deyarli jim (-85 dB dan past)
 * - unknown: ffmpeg yiqildi yoki parse bo‘lmadi (telefon uploadini rad etmaslik)
 */
const measureAudioLevel = async (buffer, originalName = 'sample.webm') => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'violet-vol-'));
  const inputPath = path.join(tmpDir, originalName.replace(/[^\w.-]/g, '_'));

  try {
    await fs.writeFile(inputPath, buffer);
    const { stderr } = await execFileAsync(
      FFMPEG_BIN,
      ['-hide_banner', '-i', inputPath, '-af', 'volumedetect', '-f', 'null', '-'],
      { timeout: 60_000, maxBuffer: 2 * 1024 * 1024 }
    );
    const db = parseMeanVolume(stderr);
    if (db == null) return { status: 'unknown', db: null };
    if (db <= UNRELIABLE_VOLUME_DB) return { status: 'silent', db };
    return { status: 'ok', db };
  } catch {
    return { status: 'unknown', db: null };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
};

/** Orqaga moslik: faqat raqam yoki null */
const measureAudioLevelDb = async (buffer, originalName = 'sample.webm') => {
  const result = await measureAudioLevel(buffer, originalName);
  if (result.status === 'ok') return result.db;
  if (result.status === 'silent') return result.db;
  return null;
};

const isAudioLevelSufficient = (meanVolumeDb) => {
  if (meanVolumeDb == null || Number.isNaN(meanVolumeDb)) return true;
  return meanVolumeDb >= MIN_MEAN_VOLUME_DB;
};

module.exports = {
  MIN_MEAN_VOLUME_DB,
  measureAudioLevel,
  measureAudioLevelDb,
  isAudioLevelSufficient,
};
