import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isActorLike = (item) =>
  item &&
  typeof item === 'object' &&
  item.id != null &&
  item.name != null &&
  typeof item.image === 'string';

export const normalizeActorsPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isActorLike);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Actors API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllActors = async () => {
  const data = await fetchJson(`${API_BASE_URL}/actors`);
  return normalizeActorsPayload(data);
};

export const fetchActorsByGenre = async (actorsGenre) => {
  const data = await fetchJson(
    `${API_BASE_URL}/actors/genre/${encodeURIComponent(actorsGenre)}`
  );
  return normalizeActorsPayload(data);
};

export const fetchActorsByIds = async (ids = []) => {
  const list = (Array.isArray(ids) ? ids : [])
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
  if (list.length === 0) return [];
  const query = new URLSearchParams({ ids: list.join(',') });
  const data = await fetchJson(`${API_BASE_URL}/actors?${query.toString()}`);
  return normalizeActorsPayload(data);
};

export const fetchActorById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/actors/${id}`);
  return isActorLike(data?.data) ? data.data : null;
};
