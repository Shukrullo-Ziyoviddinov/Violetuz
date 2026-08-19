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

const ruPlural = (n, one, few, many) => {
  const abs = Math.abs(n);
  const n10 = abs % 10;
  const n100 = abs % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
  return many;
};

/**
 * Komment yozilgan vaqt — uz/ru nisbiy matn.
 * 34 daqiqa oldin, 1 soat oldin, 1 hafta oldin, 2 oy oldin, 1 yil oldin
 */
export const formatCommentTimeAgo = (value, lang = 'uz') => {
  const isRu = String(lang || '').toLowerCase().startsWith('ru');
  const t = new Date(value).getTime();
  if (!Number.isFinite(t) || t <= 0) return '';

  const diffMs = Math.max(0, Date.now() - t);
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return isRu ? 'только что' : 'hozir';

  if (minutes < 60) {
    return isRu
      ? `${minutes} ${ruPlural(minutes, 'минуту', 'минуты', 'минут')} назад`
      : `${minutes} daqiqa oldin`;
  }

  if (hours < 24) {
    return isRu
      ? `${hours} ${ruPlural(hours, 'час', 'часа', 'часов')} назад`
      : `${hours} soat oldin`;
  }

  if (days < 7) {
    return isRu
      ? `${days} ${ruPlural(days, 'день', 'дня', 'дней')} назад`
      : `${days} kun oldin`;
  }

  const weeks = Math.floor(days / 7);
  if (days < 30) {
    return isRu
      ? `${weeks} ${ruPlural(weeks, 'неделю', 'недели', 'недель')} назад`
      : `${weeks} hafta oldin`;
  }

  const months = Math.floor(days / 30);
  if (days < 365) {
    return isRu
      ? `${months} ${ruPlural(months, 'месяц', 'месяца', 'месяцев')} назад`
      : `${months} oy oldin`;
  }

  const years = Math.floor(days / 365);
  return isRu
    ? `${years} ${ruPlural(years, 'год', 'года', 'лет')} назад`
    : `${years} yil oldin`;
};
