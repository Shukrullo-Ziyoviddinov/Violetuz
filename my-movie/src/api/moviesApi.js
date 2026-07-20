import {
  normalizeMoviesPayload,
  normalizeMovieSectionsPayload,
  normalizeHomeContentPayload,
  isMovieLike,
} from './moviesValidation';

const resolveApiBaseUrl = () => {
  if (process.env.REACT_APP_MOVIE_API_URL) {
    return process.env.REACT_APP_MOVIE_API_URL;
  }

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000/api';
  }

  // Production-safe fallback: same-origin API (for proxy/edge rewrites).
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  return 'http://localhost:5000/api';
};

const API_BASE_URL = resolveApiBaseUrl();

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Movies API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllMovies = async () => {
  const data = await fetchJson(`${API_BASE_URL}/movies`);
  return normalizeMoviesPayload(data);
};

export const fetchMoviesByCategory = async (categoryName) => {
  const query = new URLSearchParams({ categoryName });
  const data = await fetchJson(`${API_BASE_URL}/movies?${query.toString()}`);
  return normalizeMoviesPayload(data);
};

export const fetchMovieById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/movies/${id}`);
  return isMovieLike(data?.data) ? data.data : null;
};

export const fetchMovieSections = async () => {
  const data = await fetchJson(`${API_BASE_URL}/movie-sections`);
  return normalizeMovieSectionsPayload(data);
};

export const fetchHomeContent = async () => {
  const data = await fetchJson(`${API_BASE_URL}/movie-sections/home-content`);
  return normalizeHomeContentPayload(data);
};
