import { resolveApiBaseUrl } from './apiBase';
import {
  isMusicLike,
  normalizeMusicPayload,
  normalizeMusicSectionsPayload,
  normalizeMusicPageContentPayload,
} from './musicValidation';

const API_BASE_URL = resolveApiBaseUrl();

const fetchJson = async (url) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Music API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllMusic = async () => {
  const data = await fetchJson(`${API_BASE_URL}/music`);
  return normalizeMusicPayload(data);
};

export const fetchMusicByCategory = async (categoryNameMusic) => {
  const query = new URLSearchParams({ categoryNameMusic });
  const data = await fetchJson(`${API_BASE_URL}/music?${query.toString()}`);
  return normalizeMusicPayload(data);
};

export const fetchMusicByArtist = async (artistId) => {
  const data = await fetchJson(`${API_BASE_URL}/music/artist/${encodeURIComponent(artistId)}`);
  return normalizeMusicPayload(data);
};

export const fetchMusicById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/music/${id}`);
  return isMusicLike(data?.data) ? data.data : null;
};

export const fetchMusicSections = async () => {
  const data = await fetchJson(`${API_BASE_URL}/music-sections`);
  return normalizeMusicSectionsPayload(data);
};

export const fetchMusicPageContent = async () => {
  const data = await fetchJson(`${API_BASE_URL}/music-sections/page-content`);
  return normalizeMusicPageContentPayload(data);
};
