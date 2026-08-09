import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isTrillerLike = (item) =>
  item &&
  typeof item === 'object' &&
  item.id != null &&
  item.title &&
  item.video &&
  item.videoImg;

export const normalizeTrillersPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isTrillerLike);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Trillers API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllTrillers = async () => {
  const data = await fetchJson(`${API_BASE_URL}/trillers`);
  return normalizeTrillersPayload(data);
};

export const fetchTrillerById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/trillers/${encodeURIComponent(id)}`);
  return isTrillerLike(data?.data) ? data.data : null;
};
