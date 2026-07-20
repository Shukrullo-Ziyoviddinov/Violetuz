import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isGenreLike = (item) =>
  item &&
  typeof item === 'object' &&
  typeof item.id === 'string' &&
  item.title != null &&
  (typeof item.filterGenre === 'string' || Array.isArray(item.filterGenre));

export const normalizeGenresPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isGenreLike);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Genres API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllGenres = async () => {
  const data = await fetchJson(`${API_BASE_URL}/genres`);
  return normalizeGenresPayload(data);
};

export const fetchGenreById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/genres/${encodeURIComponent(id)}`);
  return isGenreLike(data?.data) ? data.data : null;
};
