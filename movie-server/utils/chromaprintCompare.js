/**
 * Chromaprint fingerprint decode + compare (pure JS).
 * fpcalc -json -raw → JSON array of uint32 stored in MongoDB.
 */

const popCount32 = (n) => {
  let v = n >>> 0;
  v -= (v >> 1) & 0x55555555;
  v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
  return (((v + (v >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24;
};

const decodeFingerprint = (encoded) => {
  if (!encoded) return [];

  if (Array.isArray(encoded)) {
    return encoded.map((n) => n >>> 0);
  }

  const str = String(encoded).trim();
  if (!str) return [];

  // New format: JSON array from `fpcalc -json -raw`
  if (str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed.map((n) => n >>> 0) : [];
    } catch {
      return [];
    }
  }

  // Legacy compressed AcoustID strings cannot be compared without libchromaprint.
  return [];
};

/**
 * Best alignment score between query (short) and reference (long).
 * Returns 0..1 where 1 is identical.
 */
const compareFingerprintStrings = (queryFp, referenceFp) => {
  const query = decodeFingerprint(queryFp);
  const reference = decodeFingerprint(referenceFp);

  if (query.length < 4 || reference.length < 4) return 0;

  const short = query.length <= reference.length ? query : reference;
  const long = query.length <= reference.length ? reference : query;

  let best = 0;
  const maxOffset = Math.max(0, long.length - short.length);

  for (let offset = 0; offset <= maxOffset; offset += 1) {
    let bitErrors = 0;
    const compareLen = short.length;
    for (let i = 0; i < compareLen; i += 1) {
      bitErrors += popCount32(short[i] ^ long[offset + i]);
    }
    const maxBits = compareLen * 32;
    const score = maxBits > 0 ? 1 - bitErrors / maxBits : 0;
    if (score > best) best = score;
  }

  return best;
};

module.exports = {
  decodeFingerprint,
  compareFingerprintStrings,
};
