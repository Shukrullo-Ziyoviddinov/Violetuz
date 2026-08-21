/**
 * Yuklangan vaqt — relative matn (klip / konsert / triller).
 * Admin create qilganda Mongo `createdAt` avtomatik yoziladi; bu yerda faqat format.
 */

const ruPlural = (n, one, few, many) => {
  const abs = Math.abs(n);
  const n10 = abs % 10;
  const n100 = abs % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
  return many;
};

/**
 * @param {string|number|Date|null|undefined} value - createdAt
 * @param {string} [lang='uz']
 * @returns {string} masalan: "10 daqiqa oldin", "1 soat oldin", "1 kun oldin"
 */
export const formatUploadedAt = (value, lang = 'uz') => {
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
