const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const https = require('https');
const http = require('http');

const Music = require('../../models/Music.model');
const Artist = require('../../models/Artist.model');
const { compareFingerprintStrings, decodeFingerprint } = require('../../utils/chromaprintCompare');
const { measureAudioLevelDb, isAudioLevelSufficient } = require('../../utils/audioLevel');
const { resolveMediaUrl, resolveLocalMediaPath } = require('../../utils/resolveMediaUrl');
const { fingerprintFromFile, fingerprintFromBuffer } = require('./fpcalcRunner');

// Shovqin ~0.62 (gap ~0.04), haqiqiy musiqa ~0.72+ yoki gap >= 0.08
const MATCH_THRESHOLD = Number(process.env.FINGERPRINT_MATCH_THRESHOLD) || 0.72;
const MATCH_LIMIT = Number(process.env.FINGERPRINT_MATCH_LIMIT) || 8;
const MIN_SCORE_GAP = Number(process.env.FINGERPRINT_MIN_SCORE_GAP) || 0.08;
const MIN_ABSOLUTE_SCORE = Number(process.env.FINGERPRINT_MIN_ABSOLUTE_SCORE) || 0.6;
const UNKNOWN_VOLUME_MIN_SCORE = Number(process.env.FINGERPRINT_UNKNOWN_VOLUME_MIN_SCORE) || 0.85;
const MIN_QUERY_DURATION_SEC = Number(process.env.FINGERPRINT_MIN_QUERY_DURATION_SEC) || 5;
const MIN_QUERY_FRAMES = Number(process.env.FINGERPRINT_MIN_QUERY_FRAMES) || 8;

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
  const legacyOrMissing = {
    $or: [
      { fingerprint: '' },
      { fingerprint: { $exists: false } },
      // Eski compressed format (AQAD...) — raw JSON array emas
      { fingerprint: { $not: /^\[/ } },
    ],
  };

  const query = onlyMissing
    ? { audio: { $ne: '' }, ...legacyOrMissing }
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

const groupCatalogByFingerprint = (tracks) => {
  const groups = new Map();
  for (const track of tracks) {
    const fp = String(track.fingerprint || '');
    if (!fp) continue;
    if (!groups.has(fp)) groups.set(fp, []);
    groups.get(fp).push(track);
  }
  return groups;
};

const pickConfidentMatches = (fpScored, { meanVolumeDb } = {}) => {
  if (!fpScored.length) {
    return { matches: [], bestScore: 0, rejectedReason: 'no_confident_match' };
  }

  const threshold =
    meanVolumeDb == null
      ? Math.max(MATCH_THRESHOLD, UNKNOWN_VOLUME_MIN_SCORE)
      : MATCH_THRESHOLD;

  const bestScore = fpScored[0].score;
  const secondScore = fpScored[1]?.score ?? 0;
  const gap = bestScore - secondScore;

  if (bestScore < MIN_ABSOLUTE_SCORE) {
    return { matches: [], bestScore, rejectedReason: 'no_confident_match' };
  }

  const confident =
    bestScore >= threshold || (bestScore >= MIN_ABSOLUTE_SCORE && gap >= MIN_SCORE_GAP);

  if (!confident) {
    return { matches: [], bestScore, rejectedReason: 'no_confident_match' };
  }

  const minAccepted = Math.max(MIN_ABSOLUTE_SCORE, bestScore - 0.02);
  const winningGroups = fpScored.filter((item) => item.score >= minAccepted);

  const expanded = [];
  for (const group of winningGroups) {
    for (const track of group.tracks) {
      expanded.push({ track, score: group.score });
    }
  }

  expanded.sort((a, b) => b.score - a.score || a.track.id - b.track.id);

  return {
    matches: expanded.slice(0, MATCH_LIMIT),
    bestScore,
    rejectedReason: null,
  };
};

const identifyFromAudioBuffer = async (buffer, originalName) => {
  try {
    const queryFp = await fingerprintFromBuffer(buffer, originalName);

    if (queryFp.duration < MIN_QUERY_DURATION_SEC) {
      return {
        queryDuration: queryFp.duration,
        bestScore: 0,
        meanVolumeDb: null,
        rejectedReason: 'audio_too_short',
        matches: [],
      };
    }

    const meanVolumeDb = await measureAudioLevelDb(buffer, originalName);
    if (!isAudioLevelSufficient(meanVolumeDb)) {
      return {
        queryDuration: queryFp.duration,
        bestScore: 0,
        meanVolumeDb,
        rejectedReason: 'audio_too_quiet',
        matches: [],
      };
    }

    const queryFrames = decodeFingerprint(queryFp.fingerprint).length;

    if (queryFrames < MIN_QUERY_FRAMES) {
      return {
        queryDuration: queryFp.duration,
        bestScore: 0,
        meanVolumeDb,
        rejectedReason: 'audio_too_short',
        matches: [],
      };
    }

    const catalog = await Music.find({
      fingerprint: { $exists: true, $ne: '', $regex: /^\[/ },
    })
      .select({ id: 1, title: 1, artistId: 1, img: 1, fingerprint: 1 })
      .lean();

    const fpGroups = groupCatalogByFingerprint(catalog);

    const fpScored = [...fpGroups.entries()]
      .map(([fingerprint, tracks]) => ({
        fingerprint,
        tracks,
        score: compareFingerprintStrings(queryFp.fingerprint, fingerprint),
      }))
      .sort((a, b) => b.score - a.score);

    const { matches: confident, bestScore, rejectedReason } = pickConfidentMatches(fpScored, {
      meanVolumeDb,
    });

    const artistMap = await buildArtistNameMap(confident.map((s) => s.track.artistId));

    return {
      queryDuration: queryFp.duration,
      meanVolumeDb,
      bestScore: Math.round(bestScore * 1000) / 1000,
      rejectedReason,
      matches: confident.map(({ track, score }) => ({
        id: track.id,
        title: track.title,
        artistId: track.artistId,
        artistName: artistMap.get(track.artistId) || track.artistId,
        img: track.img || '',
        score: Math.round(score * 1000) / 1000,
      })),
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[identify] failed:', err.message);
    return {
      queryDuration: 0,
      bestScore: 0,
      meanVolumeDb: null,
      rejectedReason: 'processing_failed',
      matches: [],
    };
  }
};

module.exports = {
  MATCH_THRESHOLD,
  MIN_SCORE_GAP,
  generateFingerprintForMusic,
  upsertMusicFingerprint,
  generateAllFingerprints,
  identifyFromAudioBuffer,
};
