import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isShortVideoLike = (item) =>
  item &&
  typeof item === 'object' &&
  item.id != null &&
  item.movieId != null &&
  item.video &&
  typeof item.video === 'object';

export const normalizeShortsPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isShortVideoLike);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Shorts API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllShorts = async () => {
  const data = await fetchJson(`${API_BASE_URL}/shorts`);
  return normalizeShortsPayload(data);
};

export const fetchShortsByMovieId = async (movieId) => {
  const data = await fetchJson(`${API_BASE_URL}/shorts/movie/${encodeURIComponent(movieId)}`);
  return normalizeShortsPayload(data);
};

export const fetchShortById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/shorts/${id}`);
  return isShortVideoLike(data?.data) ? data.data : null;
};
