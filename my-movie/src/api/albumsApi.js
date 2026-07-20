import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isAlbumLike = (item) =>
  item &&
  typeof item === 'object' &&
  item.id != null &&
  typeof item.title === 'string' &&
  typeof item.categoryNameMusic === 'string' &&
  Array.isArray(item.songs);

export const normalizeAlbumsPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload.filter(isAlbumLike);
  }

  if (Array.isArray(payload?.data)) {
    return payload.data.filter(isAlbumLike);
  }

  return [];
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Albums API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllAlbums = async () => {
  const data = await fetchJson(`${API_BASE_URL}/albums`);
  return normalizeAlbumsPayload(data);
};

export const fetchAlbumsByCategory = async (categoryNameMusic) => {
  const query = new URLSearchParams({ categoryNameMusic });
  const data = await fetchJson(`${API_BASE_URL}/albums?${query.toString()}`);
  return normalizeAlbumsPayload(data);
};

export const fetchAlbumsByArtist = async (artistId) => {
  const data = await fetchJson(`${API_BASE_URL}/albums/artist/${encodeURIComponent(artistId)}`);
  return normalizeAlbumsPayload(data);
};

export const fetchAlbumById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/albums/${id}`);
  return isAlbumLike(data?.data) ? data.data : null;
};
