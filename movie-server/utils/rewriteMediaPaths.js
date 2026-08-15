/**
 * Rewrite root-relative catalog media paths to absolute R2 public URLs.
 * Leaves SPA routes like /music/more/... and /music/shorts untouched.
 */

const MUSIC_MEDIA_RE = /\.(mp3|wav|m4a|aac|ogg|flac|svg)(\?.*)?$/i;

const rewriteMediaPath = (value, publicUrl) => {
  if (typeof value !== 'string' || !value) return value;

  const base = String(publicUrl || '')
    .trim()
    .replace(/\/+$/, '');

  if (!base) return value;

  // Already absolute (incl. prior migration / avatar URLs)
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  if (value.startsWith('/img/') || value.startsWith('/video/')) {
    return `${base}${value}`;
  }

  if (value.startsWith('/music/') && MUSIC_MEDIA_RE.test(value)) {
    return `${base}${value}`;
  }

  return value;
};

const isPlainObject = (value) =>
  Boolean(value) &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  !(value instanceof Date) &&
  !Buffer.isBuffer(value) &&
  value._bsontype === undefined &&
  value.constructor === Object;

const deepRewriteMediaPaths = (value, publicUrl, stats = { rewritten: 0 }) => {
  if (typeof value === 'string') {
    const next = rewriteMediaPath(value, publicUrl);
    if (next !== value) stats.rewritten += 1;
    return next;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepRewriteMediaPaths(item, publicUrl, stats));
  }

  if (isPlainObject(value)) {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = deepRewriteMediaPaths(child, publicUrl, stats);
    }
    return out;
  }

  return value;
};

module.exports = {
  rewriteMediaPath,
  deepRewriteMediaPaths,
  MUSIC_MEDIA_RE,
};
