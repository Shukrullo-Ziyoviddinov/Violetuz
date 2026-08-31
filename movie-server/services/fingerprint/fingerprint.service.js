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

// Sukunat ~0.75, shovqin ~0.64, haqiqiy musiqa ~0.94+ ball oladi
const MATCH_THRESHOLD = Number(process.env.FINGERPRINT_MATCH_THRESHOLD) || 0.82;
const MATCH_LIMIT = Number(process.env.FINGERPRINT_MATCH_LIMIT) || 3;
const MIN_SCORE_GAP = Number(process.env.FINGERPRINT_MIN_SCORE_GAP) || 0.04;
const MIN_QUERY_FRAMES = Number(process.env.FINGERPRINT_MIN_QUERY_FRAMES) || 12;
const AMBIGUOUS_TIE_COUNT = Number(process.env.FINGERPRINT_AMBIGUOUS_TIE_COUNT) || 4;
const AMBIGUOUS_TIE_MAX_SCORE = Number(process.env.FINGERPRINT_AMBIGUOUS_TIE_MAX_SCORE) || 0.9;

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

const dedupeCatalogByFingerprint = (tracks) => {
  const seen = new Set();
  return tracks.filter((track) => {
    const fp = String(track.fingerprint || '');
    if (!fp || seen.has(fp)) return false;
    seen.add(fp);
    return true;
  });
};

const countNearTopScores = (scored, bestScore, epsilon = 0.015) => {
  if (!scored.length) return 0;
  return scored.filter((item) => bestScore - item.score <= epsilon).length;
};

const pickConfidentMatches = (allScored) => {
  if (!allScored.length) {
    return { matches: [], bestScore: 0, rejectedReason: 'no_confident_match' };
  }

  const bestScore = allScored[0].score;
  const secondScore = allScored[1]?.score ?? 0;
  const tieCount = countNearTopScores(allScored, bestScore);

  if (bestScore < MATCH_THRESHOLD) {
    return { matches: [], bestScore, rejectedReason: 'no_confident_match' };
  }

  if (tieCount >= AMBIGUOUS_TIE_COUNT && bestScore < AMBIGUOUS_TIE_MAX_SCORE) {
    return { matches: [], bestScore, rejectedReason: 'ambiguous_match' };
  }

  if (bestScore - secondScore < MIN_SCORE_GAP && bestScore < 0.95) {
    return { matches: [], bestScore, rejectedReason: 'ambiguous_match' };
  }

  const matches = allScored
    .filter((item) => item.score >= MATCH_THRESHOLD)
    .slice(0, MATCH_LIMIT);

  return { matches, bestScore, rejectedReason: null };
};

const identifyFromAudioBuffer = async (buffer, originalName) => {
  const meanVolumeDb = await measureAudioLevelDb(buffer, originalName);
  if (!isAudioLevelSufficient(meanVolumeDb)) {
    return {
      queryDuration: 0,
      bestScore: 0,
      meanVolumeDb,
      rejectedReason: 'audio_too_quiet',
      matches: [],
    };
  }

  const queryFp = await fingerprintFromBuffer(buffer, originalName);
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

  const uniqueCatalog = dedupeCatalogByFingerprint(catalog);

  const allScored = uniqueCatalog
    .map((track) => ({
      track,
      score: compareFingerprintStrings(queryFp.fingerprint, track.fingerprint),
    }))
    .sort((a, b) => b.score - a.score);

  const { matches: confident, bestScore, rejectedReason } = pickConfidentMatches(allScored);

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
};

module.exports = {
  MATCH_THRESHOLD,
  MIN_SCORE_GAP,
  generateFingerprintForMusic,
  upsertMusicFingerprint,
  generateAllFingerprints,
  identifyFromAudioBuffer,
};
