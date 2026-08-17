/**
 * Faqat UI format — hisoblash backendda (utils/calculateMovieRating.js).
 * Asosiy son + nuqtadan keyin 1 raqam (4.8). Qolgani ko‘rinmaydi, yaxlitlanmaydi.
 */

const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const formatMovieRating = (rating) => {
  const value = safeNumber(rating);
  if (!Number.isFinite(value)) return '';
  const sign = value < 0 ? '-' : '';
  const [whole, frac = ''] = String(Math.abs(value)).split('.');
  const tenths = (frac + '0').charAt(0);
  return `${sign}${whole}.${tenths}`;
};
