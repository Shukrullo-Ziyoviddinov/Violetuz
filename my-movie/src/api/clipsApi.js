import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isClipLike = (item) =>
  item &&
  typeof item === 'object' &&
  item.id != null &&
  typeof item.title === 'string' &&
  typeof item.categoryNameMusic === 'string' &&
  typeof item.video === 'string';

export const normalizeClipsPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isClipLike);
};

export const isClipSectionLike = (item) =>
  item &&
  typeof item === 'object' &&
  typeof item.id === 'string' &&
  typeof item.categoryNameMusic === 'string';

export const normalizeClipSectionsPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isClipSectionLike);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Clips API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllClips = async () => {
  const data = await fetchJson(`${API_BASE_URL}/clips`);
  return normalizeClipsPayload(data);
};

export const fetchClipsByCategory = async (categoryNameMusic) => {
  const query = new URLSearchParams({ categoryNameMusic });
  const data = await fetchJson(`${API_BASE_URL}/clips?${query.toString()}`);
  return normalizeClipsPayload(data);
};

export const fetchClipsByArtist = async (artistId) => {
  const data = await fetchJson(`${API_BASE_URL}/clips/artist/${encodeURIComponent(artistId)}`);
  return normalizeClipsPayload(data);
};

export const fetchClipById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/clips/${id}`);
  return isClipLike(data?.data) ? data.data : null;
};

export const fetchClipSections = async () => {
  const data = await fetchJson(`${API_BASE_URL}/clip-sections`);
  return normalizeClipSectionsPayload(data);
};
