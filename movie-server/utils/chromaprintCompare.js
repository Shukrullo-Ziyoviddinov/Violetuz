/**
 * Chromaprint fingerprint decode + compare (pure JS).
 * fpcalc JSON "fingerprint" string → similarity score 0..1.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._';

const popCount32 = (n) => {
  let v = n >>> 0;
  v -= (v >> 1) & 0x55555555;
  v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
  return (((v + (v >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24;
};

const decodeFingerprint = (encoded) => {
  if (!encoded || typeof encoded !== 'string') return [];

  const codes = [];
  for (let i = 0; i < encoded.length; i += 1) {
    const code = ALPHABET.indexOf(encoded[i]);
    if (code === -1) return [];
    codes.push(code);
  }

  let offset = 0;
  let x = 0;
  const fingerprint = [];

  while (offset < codes.length) {
    if (offset + 3 > codes.length) break;
    const length = (codes[offset] << 12) | (codes[offset + 1] << 6) | codes[offset + 2];
    offset += 3;
    for (let i = 0; i < length && offset < codes.length; i += 1) {
      x += codes[offset];
      fingerprint.push(x >>> 0);
      offset += 1;
    }
  }

  return fingerprint;
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
