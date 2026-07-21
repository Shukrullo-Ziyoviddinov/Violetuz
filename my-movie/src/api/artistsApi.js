import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isArtistLike = (item) =>
  item &&
  typeof item === 'object' &&
  typeof item.id === 'string' &&
  typeof item.name === 'string';

export const normalizeArtistsPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isArtistLike);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Artists API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllArtists = async () => {
  const data = await fetchJson(`${API_BASE_URL}/artists`);
  return normalizeArtistsPayload(data);
};

export const fetchArtistById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/artists/${encodeURIComponent(id)}`);
  return isArtistLike(data?.data) ? data.data : null;
};
