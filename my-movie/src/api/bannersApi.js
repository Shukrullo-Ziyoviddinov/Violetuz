import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isBannerLike = (item) =>
  item &&
  typeof item === 'object' &&
  item.id != null &&
  (item.lang === 'uz' || item.lang === 'ru') &&
  item.movieId != null;

export const normalizeBannersPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isBannerLike);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Banners API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllBanners = async () => {
  const data = await fetchJson(`${API_BASE_URL}/banners`);
  return normalizeBannersPayload(data);
};

export const fetchBannersByLang = async (lang) => {
  const data = await fetchJson(`${API_BASE_URL}/banners/lang/${encodeURIComponent(lang)}`);
  return normalizeBannersPayload(data);
};

export const fetchBannerById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/banners/${id}`);
  return isBannerLike(data?.data) ? data.data : null;
};
