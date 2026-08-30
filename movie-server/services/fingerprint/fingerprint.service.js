const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const https = require('https');
const http = require('http');

const Music = require('../../models/Music.model');
const Artist = require('../../models/Artist.model');
const { compareFingerprintStrings } = require('../../utils/chromaprintCompare');
const { resolveMediaUrl, resolveLocalMediaPath } = require('../../utils/resolveMediaUrl');
const { fingerprintFromFile, fingerprintFromBuffer } = require('./fpcalcRunner');

const MATCH_THRESHOLD = Number(process.env.FINGERPRINT_MATCH_THRESHOLD) || 0.55;
const MATCH_LIMIT = Number(process.env.FINGERPRINT_MATCH_LIMIT) || 8;

const downloadToFile = (url, destPath) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`Download failed: HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', async () => {
        try {
          await fs.writeFile(destPath, Buffer.concat(chunks));
          resolve(destPath);
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(90_000, () => {
      req.destroy(new Error('Download timeout'));
    });
  });

const resolveAudioSource = async (audioPath) => {
  const local = resolveLocalMediaPath(audioPath);
  if (local) return { type: 'file', path: local };

  const url = resolveMediaUrl(audioPath);
  if (!url) return null;

  if (!/^https?:\/\//i.test(url)) {
    return { type: 'file', path: url };
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'violet-audio-'));
  const ext = path.extname(url.split('?')[0]) || '.mp3';
  const dest = path.join(tmpDir, `source${ext}`);
  await downloadToFile(url, dest);
  return { type: 'temp', path: dest, tmpDir };
};

const cleanupSource = async (source) => {
  if (!source?.tmpDir) return;
  await fs.rm(source.tmpDir, { recursive: true, force: true }).catch(() => {});
};

const generateFingerprintForMusic = async (musicDoc) => {
  const audioPath = musicDoc?.audio;
  if (!audioPath) {
    return null;
  }

  const source = await resolveAudioSource(audioPath);
  if (!source) return null;

  try {
    const result = await fingerprintFromFile(source.path);
    return result;
  } finally {
    await cleanupSource(source);
  }
};

const upsertMusicFingerprint = async (musicId) => {
  const music = await Music.findOne({ id: musicId }).lean();
  if (!music) {
    throw new Error(`Music not found: ${musicId}`);
  }

  const fp = await generateFingerprintForMusic(music);
  if (!fp) {
    throw new Error(`Could not fingerprint music id=${musicId}`);
  }

  await Music.updateOne(
    { id: musicId },
    {
      $set: {
        fingerprint: fp.fingerprint,
        fingerprintDuration: fp.duration,
      },
    }
  );

  return { id: musicId, duration: fp.duration };
};

const generateAllFingerprints = async ({ onlyMissing = true } = {}) => {
  const query = onlyMissing
    ? { audio: { $ne: '' }, $or: [{ fingerprint: '' }, { fingerprint: { $exists: false } }] }
    : { audio: { $ne: '' } };

  const tracks = await Music.find(query).select({ id: 1, audio: 1, title: 1 }).sort({ id: 1 }).lean();

  const summary = { total: tracks.length, ok: 0, failed: [] };

  for (const track of tracks) {
    try {
      await upsertMusicFingerprint(track.id);
      summary.ok += 1;
      // eslint-disable-next-line no-console
      console.log(`[fingerprint] ok id=${track.id} ${track.title || ''}`);
    } catch (err) {
      summary.failed.push({ id: track.id, title: track.title, error: err.message });
      // eslint-disable-next-line no-console
      console.error(`[fingerprint] fail id=${track.id}: ${err.message}`);
    }
  }

  return summary;
};

const buildArtistNameMap = async (artistIds) => {
  const unique = [...new Set(artistIds.filter(Boolean))];
  if (!unique.length) return new Map();

  const artists = await Artist.find({ id: { $in: unique } }).select({ id: 1, name: 1 }).lean();
  return new Map(artists.map((a) => [a.id, a.name]));
};

const identifyFromAudioBuffer = async (buffer, originalName) => {
  const queryFp = await fingerprintFromBuffer(buffer, originalName);

  const catalog = await Music.find({
    fingerprint: { $exists: true, $ne: '' },
  })
    .select({ id: 1, title: 1, artistId: 1, img: 1, fingerprint: 1 })
    .lean();

  const scored = catalog
    .map((track) => ({
      track,
      score: compareFingerprintStrings(queryFp.fingerprint, track.fingerprint),
    }))
    .filter((item) => item.score >= MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MATCH_LIMIT);

  const artistMap = await buildArtistNameMap(scored.map((s) => s.track.artistId));

  return {
    queryDuration: queryFp.duration,
    matches: scored.map(({ track, score }) => ({
      id: track.id,
      title: track.title,
      artistId: track.artistId,
      artistName: artistMap.get(track.artistId) || track.artistId,
      img: track.img || '',
      score: Math.round(score * 1000) / 1000,
    })),
  };
};

module.exports = {
  MATCH_THRESHOLD,
  generateFingerprintForMusic,
  upsertMusicFingerprint,
  generateAllFingerprints,
  identifyFromAudioBuffer,
};
