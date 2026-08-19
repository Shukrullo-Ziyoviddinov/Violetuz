import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isMusicShortLike = (item) =>
  item &&
  typeof item === 'object' &&
  item.id != null &&
  item.musicId != null &&
  (item.contentType === 'music' || item.contentType === 'klip' || item.contentType === 'konsert') &&
  item.video &&
  typeof item.video === 'object';

export const normalizeMusicShortsPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isMusicShortLike);
};

const fetchJson = async (url) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Music shorts API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllMusicShorts = async () => {
  const data = await fetchJson(`${API_BASE_URL}/music-shorts`);
  return normalizeMusicShortsPayload(data);
};

export const fetchMusicShortsByArtist = async (artistId) => {
  const data = await fetchJson(
    `${API_BASE_URL}/music-shorts/artist/${encodeURIComponent(artistId)}`
  );
  return normalizeMusicShortsPayload(data);
};

export const fetchMusicShortById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/music-shorts/${id}`);
  return isMusicShortLike(data?.data) ? data.data : null;
};
