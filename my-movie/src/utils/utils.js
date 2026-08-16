/**
 * Rasm yo'lini normalizatsiya qiladi
 * @param {string} path - Rasm yo'li
 * @returns {string}
 */
export const normalizeImagePath = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path;
  }
  return `/${path.replace(/^\//, '')}`;
};

/**
 * Tilga qarab matn yoki obyektdan qiymat oladi
 * @param {string|object} text - Matn yoki { uz, ru, ... } obyekti
 * @param {string} lang - Til kodi
 * @returns {string}
 */
export const getLocalizedText = (text, lang) => {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[lang] || text.uz || text.ru || text.en || '';
};

/**
 * 0–999 aniq; 1000+ → 1K / 1.1K (pastga, 0.1K qadam).
 * 1000–1099 → 1K, 1100 → 1.1K, 1560 → 1.5K, 10245 → 10.2K
 */
const formatCompactCount = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num) || num < 0) return '0';
  const whole = Math.floor(num);
  if (whole < 1000) return String(whole);
  if (whole < 1_000_000) {
    const k = Math.floor(whole / 100) / 10;
    return Number.isInteger(k) ? `${k}K` : `${k.toFixed(1)}K`;
  }
  const m = Math.floor(whole / 100_000) / 10;
  return Number.isInteger(m) ? `${m}M` : `${m.toFixed(1)}M`;
};

/** Obunachi va umumiy sonlar */
export const formatCount = (n) => formatCompactCount(n);

/** Shorts like soni */
export const formatShortsLikeCount = (n) => formatCompactCount(n);

/** Movie / konsert / triller like-dislike / comment */
export const formatActionCount = (n) => formatCompactCount(n);
