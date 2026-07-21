import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isMusicBannerLike = (item) =>
  item &&
  typeof item === 'object' &&
  item.id != null &&
  typeof item.img === 'string' &&
  item.buttonId != null;

export const normalizeMusicBannersPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isMusicBannerLike);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Music banners API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllMusicBanners = async () => {
  const data = await fetchJson(`${API_BASE_URL}/music-banners`);
  return normalizeMusicBannersPayload(data);
};

export const fetchMusicBannerById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/music-banners/${id}`);
  return isMusicBannerLike(data?.data) ? data.data : null;
};
