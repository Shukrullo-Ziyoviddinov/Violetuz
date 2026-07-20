import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isAdLike = (item) =>
  item &&
  typeof item === 'object' &&
  item.id != null &&
  typeof item.videoUrl === 'string';

export const normalizeAdsPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isAdLike);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Ads API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllAds = async () => {
  const data = await fetchJson(`${API_BASE_URL}/ads`);
  return normalizeAdsPayload(data);
};

export const fetchActiveAds = async () => {
  const data = await fetchJson(`${API_BASE_URL}/ads/active`);
  return normalizeAdsPayload(data);
};

export const fetchAdById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/ads/${id}`);
  return isAdLike(data?.data) ? data.data : null;
};
