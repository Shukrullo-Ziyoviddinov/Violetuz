const STORAGE_KEY = 'violet-movie-rating-multipliers-v2';

const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const readStorage = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
};

const writeStorage = (data) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // ignore localStorage errors (quota/private mode)
  }
};

export const getRatingIncrementByVote = (vote) => {
  const numericVote = Math.max(1, Math.min(10, Math.floor(safeNumber(vote, 0))));
  // User logic: qiymatning o'zi ko'payib o'sadi.
  // 10 -> 0.01 (1%), 7 -> 0.0007, 1 -> 0.0001
  if (numericVote === 10) return 0.01;
  return numericVote * 0.0001;
};

export const calculateMovieRating = (movieId, defaultRating) => {
  const baseRating = safeNumber(defaultRating);
  const storage = readStorage();
  const movieData = storage[String(movieId)] || {};
  const userVote = safeNumber(movieData.userVote, 0);
  if (userVote < 1 || userVote > 10) return baseRating;
  const increment = getRatingIncrementByVote(userVote);
  return baseRating * (1 + increment);
};

export const getMovieLastVote = (movieId) => {
  const storage = readStorage();
  const movieData = storage[String(movieId)] || {};
  const lastVote = safeNumber(movieData.lastVote, 0);
  if (lastVote < 1 || lastVote > 10) return null;
  return Math.floor(lastVote);
};

export const submitMovieRating = (movieId, defaultRating, vote) => {
  const key = String(movieId);
  const storage = readStorage();
  const voteValue = Math.max(1, Math.min(10, Math.floor(safeNumber(vote, 0))));
  const increment = getRatingIncrementByVote(voteValue);

  const updated = {
    userVote: voteValue,
    lastVote: voteValue,
  };
  storage[key] = updated;
  writeStorage(storage);
  return safeNumber(defaultRating) * (1 + increment);
};

export const formatMovieRating = (rating) => {
  const value = safeNumber(rating);
  return value.toFixed(1).replace(/\.0$/, '');
};
