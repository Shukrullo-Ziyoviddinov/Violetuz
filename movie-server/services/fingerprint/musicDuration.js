/**
 * Trek davomiyligi — bitta manba: Music.durationSec (fingerprint sync da yoziladi).
 * Identify va UI faqat shu maydondan o'qiydi; brauzer/metadata fallback yo'q.
 */

const normalizeDurationSec = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
};

/** Bir xil audio fayl uchun davomiylik (duplicate trek DB) — O(n) bir marta */
const buildAudioDurationMap = (catalog) => {
  const map = new Map();

  for (const track of catalog) {
    const audioKey = String(track.audio || '').trim();
    if (!audioKey) continue;

    const sec =
      normalizeDurationSec(track.durationSec) ??
      normalizeDurationSec(track.fingerprintDuration);

    if (sec == null) continue;

    const prev = map.get(audioKey);
    if (prev == null || sec > prev) {
      map.set(audioKey, sec);
    }
  }

  return map;
};

const resolveDurationSec = (track, durationByAudio) => {
  const own =
    normalizeDurationSec(track.durationSec) ??
    normalizeDurationSec(track.fingerprintDuration);
  if (own != null) return own;

  const audioKey = String(track.audio || '').trim();
  if (!audioKey || !durationByAudio) return null;

  return durationByAudio.get(audioKey) ?? null;
};

/** Fingerprint sync dan keyin bir xil audio dagi barcha treklarga duration yozish */
const propagateDurationByAudio = async (Music, audioPath, durationSec) => {
  const audioKey = String(audioPath || '').trim();
  const sec = normalizeDurationSec(durationSec);
  if (!audioKey || sec == null) return { modified: 0 };

  const result = await Music.updateMany(
    { audio: audioKey },
    { $set: { durationSec: sec, fingerprintDuration: sec } }
  );

  return { modified: result.modifiedCount ?? 0 };
};

module.exports = {
  normalizeDurationSec,
  buildAudioDurationMap,
  resolveDurationSec,
  propagateDurationByAudio,
};
