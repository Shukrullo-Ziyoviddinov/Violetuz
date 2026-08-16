/**
 * Faqat UI format — hisoblash backendda (utils/calculateMovieRating.js).
 */

const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const formatMovieRating = (rating) => {
  const value = safeNumber(rating);
  return value.toFixed(1).replace(/\.0$/, '');
};
