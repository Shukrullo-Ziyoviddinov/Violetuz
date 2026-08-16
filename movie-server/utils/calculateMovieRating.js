/**
 * Movie rating o‘sish algoritmi (1–10 vote).
 * 10 → +1% (×1.01); boshqa → vote × 0.0001 (masalan 7 → ×1.0007).
 */

const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const clampVote = (vote) =>
  Math.max(1, Math.min(10, Math.floor(safeNumber(vote, 0))));

/** Vote → ko‘paytirish qo‘shimchasi (0.01 yoki vote*0.0001) */
const getRatingIncrementByVote = (vote) => {
  const numericVote = clampVote(vote);
  if (numericVote === 10) return 0.01;
  return numericVote * 0.0001;
};

/** Joriy ratingga vote qo‘llash */
const applyVoteToRating = (currentRating, vote) => {
  const base = safeNumber(currentRating);
  const increment = getRatingIncrementByVote(vote);
  return base * (1 + increment);
};

/** Oldingi vote ta’sirini bekor qilish (vote o‘zgarganda) */
const reverseVoteFromRating = (currentRating, vote) => {
  const base = safeNumber(currentRating);
  const increment = getRatingIncrementByVote(vote);
  const divisor = 1 + increment;
  if (divisor === 0) return base;
  return base / divisor;
};

const formatMovieRating = (rating) => {
  const value = safeNumber(rating);
  return value.toFixed(1).replace(/\.0$/, '');
};

module.exports = {
  safeNumber,
  clampVote,
  getRatingIncrementByVote,
  applyVoteToRating,
  reverseVoteFromRating,
  formatMovieRating,
};
