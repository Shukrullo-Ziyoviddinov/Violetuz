import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const ratingFetch = (path, options = {}) =>
  fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

const parseJson = async (response) => {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok || body?.success === false) {
    const err = new Error(body?.message || 'Rating request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

/** Profil reyting history */
export const fetchRatingHistory = async () => {
  const res = await ratingFetch('/movie-ratings/history');
  return parseJson(res);
};

/** Joriy user shu filmga bergan baho */
export const fetchMyMovieRating = async (movieId) => {
  const res = await ratingFetch(`/movie-ratings/me/${encodeURIComponent(movieId)}`);
  return parseJson(res);
};

/** 1–10 baho yuborish → movie.rating serverda yangilanadi */
export const submitMovieRatingRequest = async ({ movieId, value }) => {
  const res = await ratingFetch('/movie-ratings', {
    method: 'POST',
    body: JSON.stringify({ movieId, value }),
  });
  return parseJson(res);
};
