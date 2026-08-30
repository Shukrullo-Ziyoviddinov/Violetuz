const path = require('path');
const { R2_PUBLIC_URL } = require('../config/env');

/**
 * Catalog audio/img path → absolute URL or local file path (dev).
 */
const resolveMediaUrl = (audioPath) => {
  const value = String(audioPath || '').trim();
  if (!value) return '';

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (R2_PUBLIC_URL) {
    const key = value.replace(/^\/+/, '');
    return `${R2_PUBLIC_URL}/${key}`;
  }

  return value;
};

/**
 * Local filesystem path for dev seeds (/music/foo.mp3).
 */
const resolveLocalMediaPath = (audioPath) => {
  const value = String(audioPath || '').trim();
  if (!value || /^https?:\/\//i.test(value)) return '';

  const relative = value.replace(/^\/+/, '');
  const candidates = [
    path.join(__dirname, '..', '..', 'my-movie', 'public', relative),
    path.join(__dirname, '..', 'public', relative),
  ];

  for (const candidate of candidates) {
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      if (require('fs').existsSync(candidate)) return candidate;
    } catch {
      /* ignore */
    }
  }

  return '';
};

module.exports = {
  resolveMediaUrl,
  resolveLocalMediaPath,
};
