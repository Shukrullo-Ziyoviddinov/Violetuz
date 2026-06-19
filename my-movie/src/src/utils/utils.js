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
 * Katta sonlarni qisqartirish: 1000→1k, 10000→10k, 1000000→1M
 * @param {number} n - Son
 * @returns {string}
 */
export const formatCount = (n) => {
  const num = Number(n) || 0;
  if (num < 1000) return String(num);
  if (num < 1000000) {
    if (num % 1000 === 0) return num / 1000 + 'k';
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  if (num % 1000000 === 0) return num / 1000000 + 'M';
  return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
};

/** 0-99: aniq, 100-999: 100+, 1000+: 1k, 1.1k */
export const formatActionCount = (n) => {
  const num = Number(n) || 0;
  if (num < 100) return String(num);
  if (num < 1000) return num + '+';
  if (num % 1000 === 0) return (num / 1000) + 'k';
  return (num / 1000).toFixed(1) + 'k';
};
