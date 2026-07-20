import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isConcertLike = (item) =>
  item &&
  typeof item === 'object' &&
  item.id != null &&
  typeof item.title === 'string' &&
  typeof item.categoryNameMusic === 'string' &&
  typeof item.video === 'string';

export const normalizeConcertsPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isConcertLike);
};

export const isConcertSectionLike = (item) =>
  item &&
  typeof item === 'object' &&
  typeof item.id === 'string' &&
  typeof item.categoryNameMusic === 'string';

export const normalizeConcertSectionsPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isConcertSectionLike);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Concerts API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllConcerts = async () => {
  const data = await fetchJson(`${API_BASE_URL}/concerts`);
  return normalizeConcertsPayload(data);
};

export const fetchConcertsByCategory = async (categoryNameMusic) => {
  const query = new URLSearchParams({ categoryNameMusic });
  const data = await fetchJson(`${API_BASE_URL}/concerts?${query.toString()}`);
  return normalizeConcertsPayload(data);
};

export const fetchConcertsByArtist = async (artistId) => {
  const data = await fetchJson(`${API_BASE_URL}/concerts/artist/${encodeURIComponent(artistId)}`);
  return normalizeConcertsPayload(data);
};

export const fetchConcertById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/concerts/${id}`);
  return isConcertLike(data?.data) ? data.data : null;
};

export const fetchConcertSections = async () => {
  const data = await fetchJson(`${API_BASE_URL}/concert-sections`);
  return normalizeConcertSectionsPayload(data);
};
