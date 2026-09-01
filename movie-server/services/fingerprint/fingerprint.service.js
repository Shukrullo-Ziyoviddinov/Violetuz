const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const https = require('https');
const http = require('http');

const Music = require('../../models/Music.model');
const Artist = require('../../models/Artist.model');
const { compareFingerprintStrings, decodeFingerprint } = require('../../utils/chromaprintCompare');
const { measureAudioLevel } = require('../../utils/audioLevel');
const { resolveMediaUrl, resolveLocalMediaPath } = require('../../utils/resolveMediaUrl');
const { fingerprintFromFileMultiWindow, fingerprintFromBufferMulti } = require('./fpcalcRunner');
const {
  normalizeDurationSec,
  buildAudioDurationMap,
  resolveDurationSec,
  propagateDurationByAudio,
} = require('./musicDuration');

const MIN_WINDOWS_FOR_CATALOG = 6;

// Shovqin ~0.62, telefon mikrofoni ~0.65–0.85, toza audio ~0.95+
// Render'da eski FINGERPRINT_MATCH_THRESHOLD=0.82 bo'lsa telefon o'tmaydi — clamp.
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const MATCH_THRESHOLD = clamp(Number(process.env.FINGERPRINT_MATCH_THRESHOLD) || 0.66, 0.58, 0.7);
const MATCH_LIMIT = Number(process.env.FINGERPRINT_MATCH_LIMIT) || 8;
const MIN_SCORE_GAP = Number(process.env.FINGERPRINT_MIN_SCORE_GAP) || 0.03;
const STRONG_MATCH_SCORE = clamp(Number(process.env.FINGERPRINT_STRONG_MATCH_SCORE) || 0.7, 0.65, 0.8);
const NOISE_CEILING = clamp(Number(process.env.FINGERPRINT_NOISE_CEILING) || 0.63, 0.55, 0.66);
const SILENCE_VOLUME_DB = Number(process.env.FINGERPRINT_SILENCE_VOLUME_DB) || -65;
/** Speaker musiqa odatda shundan balandroq (-46 dan yuqori) */
const LOUD_MUSIC_VOLUME_DB = Number(process.env.FINGERPRINT_LOUD_MUSIC_VOLUME_DB) || -52;
// Erta probe (~4s) uchun 5s emas — 3s yetarli
const MIN_QUERY_DURATION_SEC = Number(process.env.FINGERPRINT_MIN_QUERY_DURATION_SEC) || 3;
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
    const result = await fingerprintFromFileMultiWindow(source.path);
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

  const durationSec = normalizeDurationSec(fp.duration);
  if (durationSec == null) {
    throw new Error(`Could not resolve duration for music id=${musicId}`);
  }

  await Music.updateOne(
    { id: musicId },
    {
      $set: {
        fingerprint: fp.fingerprint,
        fingerprintDuration: durationSec,
        durationSec,
        fingerprintWindows: Array.isArray(fp.windows) ? fp.windows : [],
      },
    }
  );

  await propagateDurationByAudio(Music, music.audio, durationSec);

  return {
    id: musicId,
    duration: durationSec,
    windows: fp.windows?.length || 0,
  };
};

const generateAllFingerprints = async ({ onlyMissing = true } = {}) => {
  const legacyOrMissing = {
    $or: [
      { fingerprint: '' },
      { fingerprint: { $exists: false } },
      { fingerprint: { $not: /^\[/ } },
      { fingerprintWindows: { $exists: false } },
      { fingerprintWindows: { $size: 0 } },
      { [`fingerprintWindows.${MIN_WINDOWS_FOR_CATALOG - 1}`]: { $exists: false } },
      { fingerprintDuration: { $in: [null, 0] } },
      { fingerprintDuration: { $exists: false } },
      { durationSec: { $in: [null, 0] } },
      { durationSec: { $exists: false } },
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

const collectTrackFingerprints = (track) => {
  const fps = [];
  const main = String(track.fingerprint || '');
  if (main.startsWith('[')) fps.push(main);
  for (const win of track.fingerprintWindows || []) {
    const w = String(win?.fingerprint || '');
    if (w.startsWith('[')) fps.push(w);
  }
  return [...new Set(fps)];
};

/** Bir xil audio fayl — bitta guruh (gap hisobi to‘g‘ri bo‘lishi uchun) */
const groupCatalogByAudio = (tracks) => {
  const groups = new Map();
  for (const track of tracks) {
    const key = String(track.audio || `id:${track.id}`);
    if (!groups.has(key)) {
      groups.set(key, { audio: key, tracks: [], fingerprints: collectTrackFingerprints(track) });
    } else {
      const g = groups.get(key);
      for (const fp of collectTrackFingerprints(track)) {
        if (!g.fingerprints.includes(fp)) g.fingerprints.push(fp);
      }
    }
    groups.get(key).tracks.push(track);
  }
  return groups;
};

const scoreCatalog = (queryFingerprint, catalog, meanVolumeDb = null) => {
  const audioGroups = groupCatalogByAudio(catalog);

  const fpScored = [...audioGroups.values()]
    .map((group) => {
      let best = 0;
      for (const fp of group.fingerprints) {
        best = Math.max(best, compareFingerprintStrings(queryFingerprint, fp));
      }
      return { fingerprint: group.fingerprints[0], tracks: group.tracks, score: best };
    })
    .sort((a, b) => b.score - a.score);

  return pickConfidentMatches(fpScored, meanVolumeDb);
};

const pickConfidentMatches = (fpScored, meanVolumeDb = null) => {
  if (!fpScored.length) {
    return { matches: [], bestScore: 0, rejectedReason: 'no_confident_match' };
  }

  const bestScore = fpScored[0].score;
  const secondScore = fpScored[1]?.score ?? 0;
  const gap = bestScore - secondScore;

  if (bestScore <= NOISE_CEILING) {
    return { matches: [], bestScore, rejectedReason: 'no_confident_match' };
  }

  const strong = bestScore >= STRONG_MATCH_SCORE;
  const clearWinner = bestScore >= MATCH_THRESHOLD && gap >= MIN_SCORE_GAP;
  const wideGap = bestScore >= 0.64 && gap >= 0.05;

  // Baland speaker musiqa — yumshoqroq (telefon mikrofoni)
  const loudSource =
    meanVolumeDb == null || meanVolumeDb >= LOUD_MUSIC_VOLUME_DB;
  const loudMusicOk =
    loudSource && bestScore >= 0.63 && gap >= 0.035;

  // Past ovoz (xona shovqini) — qattiqroq
  const quietSource =
    meanVolumeDb != null && meanVolumeDb < LOUD_MUSIC_VOLUME_DB;
  const quietOk =
    quietSource &&
    (bestScore >= 0.72 || (bestScore >= 0.68 && gap >= 0.05));

  const accepted =
    strong || clearWinner || wideGap || loudMusicOk || quietOk;

  if (!accepted) {
    return { matches: [], bestScore, rejectedReason: 'no_confident_match' };
  }

  const minAccepted = Math.max(NOISE_CEILING + 0.01, bestScore - 0.03);
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
    const queryFingerprints = await fingerprintFromBufferMulti(buffer, originalName);
    const primary = queryFingerprints[0];

    if (!primary || primary.duration < MIN_QUERY_DURATION_SEC) {
      return {
        queryDuration: primary?.duration || 0,
        bestScore: 0,
        meanVolumeDb: null,
        rejectedReason: 'audio_too_short',
        matches: [],
      };
    }

    const volume = await measureAudioLevel(buffer, originalName);
    const meanVolumeDb = volume.db;
    // Faqat aniq jimlikni rad et: unknown (ffmpeg fail) — telefon yozuvini saqlab qolamiz
    if (
      volume.status === 'silent' ||
      (volume.status === 'ok' && meanVolumeDb < SILENCE_VOLUME_DB)
    ) {
      return {
        queryDuration: primary.duration,
        bestScore: 0,
        meanVolumeDb,
        rejectedReason: 'audio_too_quiet',
        matches: [],
      };
    }

    // Mikrofon shovqini / xona ovozi — musiqa emas
    // (volume-aware matching pickConfidentMatches ichida hal qilinadi)

    const catalog = await Music.find({
      fingerprint: { $exists: true, $ne: '', $regex: /^\[/ },
    })
      .select({
        id: 1,
        title: 1,
        artistId: 1,
        img: 1,
        audio: 1,
        durationSec: 1,
        fingerprint: 1,
        fingerprintWindows: 1,
        fingerprintDuration: 1,
      })
      .lean();

    const durationByAudio = buildAudioDurationMap(catalog);

    let bestResult = { matches: [], bestScore: 0, rejectedReason: 'no_confident_match' };
    let queryDuration = primary.duration;

    for (const queryFp of queryFingerprints) {
      const queryFrames = decodeFingerprint(queryFp.fingerprint).length;
      if (queryFrames < MIN_QUERY_FRAMES) continue;

      const result = scoreCatalog(queryFp.fingerprint, catalog, meanVolumeDb);
      if (result.bestScore > bestResult.bestScore) {
        bestResult = result;
        queryDuration = queryFp.duration;
      }
      if (result.matches.length) break;
    }

    const { matches: confident, bestScore, rejectedReason } = bestResult;

    const artistMap = await buildArtistNameMap(confident.map((s) => s.track.artistId));

    return {
      queryDuration,
      meanVolumeDb,
      bestScore: Math.round(bestScore * 1000) / 1000,
      rejectedReason,
      matches: confident.map(({ track, score }) => ({
        id: track.id,
        title: track.title,
        artistId: track.artistId,
        artistName: artistMap.get(track.artistId) || track.artistId,
        img: track.img || '',
        durationSec: resolveDurationSec(track, durationByAudio),
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
